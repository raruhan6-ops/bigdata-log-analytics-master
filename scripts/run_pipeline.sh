#!/bin/bash
# =============================================================================
# 大数据日志分析平台 — 全链路演示脚本
#
# 用法:
#   bash scripts/run_pipeline.sh              # 运行全流程
#   bash scripts/run_pipeline.sh --skip-gen   # 跳过日志生成
#   bash scripts/run_pipeline.sh --status     # 查看各组件状态
#
# 前提: docker-compose up -d 已启动所有容器
# =============================================================================
set -e

# Git Bash on Windows 会把 /opt/xxx 路径转成 D:/soft/Git/opt/xxx，必须关掉
export MSYS_NO_PATHCONV=1

# ---------- 配置 ----------
LOG_DIR="./data/logs"
LOG_DAYS=3
LOG_PER_DAY=5000
KAFKA_TOPIC="log_raw"
HDFS_ODS_PATH="/data/log_dw/ods/access_log"

# ---------- 颜色 ----------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
step()  { echo ""; echo -e "${GREEN}========================================${NC}"; echo -e "${GREEN}  $*${NC}"; echo -e "${GREEN}========================================${NC}"; }

# ---------- 参数解析 ----------
SKIP_GEN=false
STATUS_ONLY=false
for arg in "$@"; do
    case $arg in
        --skip-gen) SKIP_GEN=true ;;
        --status)   STATUS_ONLY=true ;;
    esac
done

# ---------- 状态检查 ----------
check_status() {
    step "1. 容器状态"
    echo ""
    docker ps --filter name=log_ --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || {
        warn "容器未运行，请先执行: docker-compose up -d"
        exit 1
    }
}

if $STATUS_ONLY; then
    check_status
    echo ""
    info "HDFS Web UI:    http://localhost:9870"
    info "Spark Master:   http://localhost:8080"
    info "Frontend:       http://localhost:5173"
    info "API Docs:       http://localhost:8001/docs"
    exit 0
fi

# ====================================================================
#  Step 1: 容器状态
# ====================================================================
check_status

# ====================================================================
#  Step 2: 生成仿真日志
# ====================================================================
if $SKIP_GEN; then
    warn "跳过日志生成 (--skip-gen)"
else
    step "2. 生成仿真日志"
    echo ""
    python scripts/log_generator.py --days "$LOG_DAYS" --per-day "$LOG_PER_DAY" --output "$LOG_DIR" 2>/dev/null || \
    python3 scripts/log_generator.py --days "$LOG_DAYS" --per-day "$LOG_PER_DAY" --output "$LOG_DIR" 2>/dev/null || {
        warn "日志生成失败，使用已有日志"
    }
    ok "日志已就绪"
fi

# ====================================================================
#  Step 3: HDFS 状态
# ====================================================================
step "3. HDFS 集群状态"
echo ""
docker exec log_namenode hdfs dfsadmin -report 2>/dev/null | grep -E "^(Live|Dead|Configured)" || warn "HDFS 未就绪"

# 确保 ODS 目录存在
docker exec log_namenode hdfs dfs -mkdir -p "$HDFS_ODS_PATH" 2>/dev/null || true
docker exec log_namenode hdfs dfs -chmod -R 777 /data 2>/dev/null || true
ok "HDFS ODS 目录: $HDFS_ODS_PATH"

# ====================================================================
#  Step 4: Flume → Kafka
# ====================================================================
step "4. Flume: 日志 → Kafka"
echo ""

# 杀掉可能残留的 Flume agent
docker exec log_flume bash -c "pkill -f flume.node.Application" 2>/dev/null || true
sleep 2

# 启动 taildir → Kafka agent
info "启动 Flume Agent (taildir → Kafka) ..."
docker exec -d log_flume bash /opt/flume/bin/start-flume.sh /opt/flume/conf/taildir-kafka.conf a1
sleep 10

# 验证 Kafka topic
if docker exec log_kafka kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | grep -q "$KAFKA_TOPIC"; then
    ok "Kafka topic '$KAFKA_TOPIC' 已创建，数据正在流入"
else
    warn "Kafka topic 未创建，请检查 Flume 日志: docker logs log_flume"
fi

# ====================================================================
#  Step 5: Flume → HDFS
# ====================================================================
step "5. Flume: Kafka → HDFS"
echo ""
info "启动 Flume Agent (Kafka → HDFS) ..."
docker exec -d log_flume bash /opt/flume/bin/start-flume.sh /opt/flume/conf/kafka-hdfs.conf a2
sleep 15

# 检查 HDFS 文件
info "HDFS ODS 目录内容:"
docker exec log_namenode hdfs dfs -ls -R "$HDFS_ODS_PATH" 2>/dev/null || warn "HDFS 中暂无文件（数据还在写入中...）"

# ====================================================================
#  Step 6: Hive 建表
# ====================================================================
step "6. Hive 数据仓库建表"
echo ""
info "等待 Hive Server2 就绪 ..."

for i in $(seq 1 20); do
    if docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 -e "SHOW DATABASES;" 2>/dev/null | grep -q "default"; then
        ok "Hive Server2 就绪"
        break
    fi
    if [ $i -eq 20 ]; then
        warn "Hive Server2 超时"
    fi
    sleep 5
done

info "执行建表 SQL ..."
docker exec -i log_hive_server2 beeline -u jdbc:hive2://localhost:10000 -f /opt/data-warehouse/init_all.sql 2>/dev/null || {
    warn "部分建表语句失败（表可能已存在）"
}
ok "Hive 表结构已就绪"

# ====================================================================
#  Step 7: 同步 Hive 分区 + 执行 ETL
# ====================================================================
step "7. Hive 分区同步 & ETL"
echo ""

info "同步 ODS 分区（MSCK REPAIR）..."
docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 \
    -e "MSCK REPAIR TABLE log_dw.ods_access_log;" 2>/dev/null || {
    warn "分区同步失败（可手动执行 ADD PARTITION）"
}

# 验证 ODS 有数据后再执行 ETL
ODS_COUNT=$(docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 \
    --silent=true --showHeader=false --outputformat=csv2 \
    -e "SELECT COUNT(*) FROM log_dw.ods_access_log;" 2>/dev/null | tail -1 | tr -d '\r\n ')

if [ -n "$ODS_COUNT" ] && [ "$ODS_COUNT" -gt 0 ] 2>/dev/null; then
    ok "ODS 数据量: $ODS_COUNT 条"

    # 获取最新 ODS 分区日期（即 Flume 写入的 dt 值）
    ETL_DATE=$(docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 \
        --silent=true --showHeader=false --outputformat=csv2 \
        -e "SELECT DISTINCT dt FROM log_dw.ods_access_log ORDER BY dt DESC LIMIT 1;" 2>/dev/null | tail -1 | tr -d '\r\n ')
    if [ -z "$ETL_DATE" ]; then
        ETL_DATE=$(date +%Y-%m-%d)
        warn "无法检测 ODS 分区，使用今天日期: $ETL_DATE"
    fi

    info "执行 ETL 管道 (ODS → DWD → DWS → ADS), 日期=$ETL_DATE ..."
    docker exec -i log_hive_server2 beeline -u jdbc:hive2://localhost:10000 \
        --hiveconf etl_date="$ETL_DATE" \
        -f /opt/data-warehouse/etl_pipeline.sql 2>/dev/null || warn "ETL 部分失败"
    ok "Hive 数据仓库各层已就绪"
else
    warn "ODS 暂无数据，跳过 ETL（请等待 Flume 写入 HDFS 后重试）"
    info "手动重试: docker exec -i log_hive_server2 beeline -u jdbc:hive2://localhost:10000 -f /opt/data-warehouse/etl_pipeline.sql"
fi

# ====================================================================
#  Step 8: Hive → MySQL 数据导入
# ====================================================================
step "8. Hive → MySQL 数据导入"
echo ""
info "将 Hive 聚合结果写入 MySQL（前端展示表）..."

if command -v python3 &>/dev/null; then
    python3 scripts/hive_to_mysql.py 2>/dev/null && ok "MySQL 数据导入完成" || {
        warn "Python 导入失败，尝试手动导入..."
        warn "请执行: python scripts/hive_to_mysql.py"
    }
elif command -v python &>/dev/null; then
    python scripts/hive_to_mysql.py 2>/dev/null && ok "MySQL 数据导入完成" || {
        warn "Python 导入失败，尝试手动导入..."
        warn "请执行: python scripts/hive_to_mysql.py"
    }
else
    warn "未找到 Python，跳过 MySQL 导入"
    info "手动执行: python scripts/hive_to_mysql.py"
fi

# ====================================================================
#  Step 9: 数据验证
# ====================================================================
step "9. 数据验证"
echo ""

info "MySQL 各表数据量:"
docker exec log_mysql mysql -uloguser -plogpass123 log_analytics \
    -e "SELECT 'kpi_daily' AS tbl, COUNT(*) AS cnt FROM kpi_daily
        UNION ALL SELECT 'kpi_hourly', COUNT(*) FROM kpi_hourly
        UNION ALL SELECT 'top_pages', COUNT(*) FROM top_pages
        UNION ALL SELECT 'terminal_dist', COUNT(*) FROM terminal_dist
        UNION ALL SELECT 'browser_dist', COUNT(*) FROM browser_dist;" 2>/dev/null || warn "MySQL 查询失败"

echo ""
info "后端 API 验证:"
curl -s http://localhost:8001/api/dashboard/overview 2>/dev/null | head -c 200 || warn "API 不可用"
echo ""

# ====================================================================
#  Step 10: 完成
# ====================================================================
step "10. 全链路就绪"
echo ""
echo "  访问地址:"
echo "    前端大盘:        http://localhost:5173"
echo "    API 文档:        http://localhost:8001/docs"
echo "    HDFS NameNode:   http://localhost:9870"
echo "    Spark Master:    http://localhost:8080"
echo "    Hive Server UI:  http://localhost:10002"
echo ""
echo "  全链路数据流:"
echo "    log_generator → Flume → Kafka → Flume → HDFS → Hive (ETL) → MySQL → 前端"
echo ""
echo "  调试命令:"
echo "    docker exec log_namenode hdfs dfs -ls -R /data/log_dw/"
echo "    docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 \\"
echo "        -e 'SELECT COUNT(*) FROM log_dw.ods_access_log;'"
echo "    curl http://localhost:8001/api/dashboard/overview"
