# 大数据离线日志分析平台

> 覆盖日志采集 → 数据清洗 → 数据分析 → 数据可视化 → 任务调度全链路

## 核心功能特性（12个功能模块）

本项目包含数据核心链路、核心大盘指标及高级交互扩展等 12 个核心特性：

**一、数据链路与系统功能：**
1. **多源日志实时采集功能**：利用 Flume 实时监听与采集 web server `access.log`。
2. **高吞吐削峰缓冲功能**：引入 Kafka 起缓冲削峰作用，保障大数据量下的高可用。
3. **分布式多分区存储功能**：按 `dt=YYYY-MM-DD` 将海量数据分区存储至 HDFS，提升检索性能。
4. **离线数仓 ETL 清洗功能**：通过 SQL 将无序日志清洗至明细建模数据 (ODS->DWD)。
5. **全链路自动化任务调度**：支持接入 DolphinScheduler 执行自动例行计算。

**二、核心大盘分析指标：**
6. **流量核心指标分析**：全局及单页面浏览量（PV）、独立访客（UV）及独立IP统计。
7. **用户留存与会话分析**：统计次日、3日及7日用户留存率与动态评估独立 Session 时长。
8. **热门检索词排行榜**：提取用户访问行为中的搜索词参数，形成热门查询词云榜单。
9. **高价值页面与流失率分析**：追踪流失最严重的访问路径及跳出率（Bounce Rate）。
10. **终端设备与浏览器画像分布**：PC/终端占比，及 Chrome/Edge 等浏览器使用画像追踪。

**三、交互与高级扩展功能：**
11. **交互式多维下钻查询**：前端图表支持根据时间（7天、30天等）做交互式联动渲染查询。
12. **移动多端可视化大盘展示**：提供高颜值数据大屏支持，由 Vue3 + Echarts 构建，自适应布局。

## 技术栈

| 层次 | 组件 |
|---|---|
| 采集 | Flume 1.x（Taildir Source） |
| 缓冲 | Kafka 3.x |
| 存储 | HDFS + Hive 3.x |
| 计算 | Spark 3.x SQL |
| 查询 | Presto / MySQL |
| 调度 | DolphinScheduler |
| 后端 | Python FastAPI |
| 前端 | Vue 3 + Element Plus + ECharts + Vite |

## 项目结构

```
├── docker/                    # Docker 初始化文件（MySQL 建表等）
├── data/logs/                 # 仿真日志输出目录
├── scripts/                   # 工具脚本
│   └── log_generator.py       # 日志生成器
├── flume/                     # Flume 采集配置
│   ├── taildir-kafka.conf     # Nginx → Kafka
│   └── kafka-hdfs.conf        # Kafka → HDFS（可选）
├── data-warehouse/            # 数据仓库 SQL
│   ├── ods/                   # ODS 原始层
│   ├── dwd/                   # DWD 明细层
│   ├── dws/                   # DWS 汇总层
│   ├── ads/                   # ADS 应用层
│   └── init_all.sql           # 一键建表
├── backend/                   # FastAPI 后端
│   └── app/
│       ├── main.py            # 应用入口
│       ├── config.py          # 配置
│       ├── api/               # 路由
│       ├── services/          # 业务逻辑
│       └── models/            # 数据模型
├── frontend/                  # Vue 3 前端
│   └── src/
│       ├── views/             # 页面
│       ├── components/        # 图表组件
│       └── api/               # 请求封装
├── docker-compose.yml         # 开发环境：Kafka + MySQL + Zookeeper
├── start.bat                  # Windows 一键启动
├── start.sh                   # Linux/Mac 一键启动
└── README.md
```

## 快速开始

### 环境要求

- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- （可选）JDK 8+、Hadoop、Hive、Spark — 用于完整大数据链路

### 1. 启动基础设施

```bash
docker-compose up -d
```

启动 Kafka + MySQL + Zookeeper（MySQL 运行在 `localhost:3307`）。

### 2. 生成仿真日志

```bash
# 生成最近 7 天、每天 5 万条日志（总共约 175MB）
python scripts/log_generator.py --days 7 --per-day 50000
```

### 3. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 文档：http://localhost:8000/docs

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开 http://localhost:5173 查看大盘。

## API 接口

| 接口 | 说明 |
|---|---|
| `GET /api/health` | 健康检查 |
| `GET /api/dashboard/overview` | KPI 总览（PV/UV/IP/平均会话/首页跳出率） |
| `GET /api/dashboard/trend?days=7` | PV/UV 趋势 |
| `GET /api/analysis/top-pages?limit=20` | 热门页面 TOP N |
| `GET /api/analysis/distribution/terminal` | 终端类型分布 |
| `GET /api/analysis/distribution/browser` | 浏览器分布 |
| `GET /api/analysis/top-keywords` | 热门检索关键词排名 (Feature 8) |
| `GET /api/analysis/bounce-rates` | 高跳出率流失页面统计 (Feature 9) |
| `GET /api/analysis/retention` | 1日/3日/7日用户留存率 (Feature 7) |

## 大数据全链路

完整链路需配合 Hadoop 集群使用。步骤如下：

### 1. 部署 Flume Agent

```bash
# 在日志所在服务器上部署 Flume，启动采集
cd $FLUME_HOME
bin/flume-ng agent -n a1 -c conf -f /path/to/flume/taildir-kafka.conf
```

### 2. Hive 建表

```bash
hive -f data-warehouse/init_all.sql
```

### 3. 每日调度任务

1. Flume 实时将日志推送到 Kafka → HDFS
2. 凌晨调度：`ALTER TABLE ods_access_log ADD PARTITION (dt='...')`
3. 执行 DWD ETL SQL（清洗 + 解析）
4. 执行 DWS 汇总 SQL（小时级聚合）
5. 执行 ADS KPI SQL（日指标宽表）
6. MySQL 同步（`INSERT INTO mysql.kpi_daily SELECT * FROM ads_kpi_daily`）

## License

MIT
