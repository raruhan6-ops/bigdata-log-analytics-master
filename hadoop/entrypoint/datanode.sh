#!/bin/bash
# =============================================================================
# DataNode 启动脚本
# 等待 NameNode Ready，然后启动 DataNode 并注册
# =============================================================================
set -e

NAMENODE_HOST="${NAMENODE_HOST:-namenode}"
NAMENODE_PORT="${NAMENODE_PORT:-9000}"

echo "========================================"
echo "  Hadoop DataNode Startup"
echo "========================================"
echo "  NameNode: $NAMENODE_HOST:$NAMENODE_PORT"

# 确保数据目录存在
mkdir -p /data/hdfs/datanode 2>/dev/null || true

# 等待 NameNode IPC 端口就绪
echo "[WAIT] Waiting for NameNode ($NAMENODE_HOST:$NAMENODE_PORT) ..."
until (
    exec 3<>/dev/tcp/$NAMENODE_HOST/$NAMENODE_PORT 2>/dev/null
) || (
    # 备选：检查 HTTP 端口 9870
    curl -s "http://$NAMENODE_HOST:9870" > /dev/null 2>&1
); do
    echo "       NameNode not ready yet, retrying in 5s ..."
    sleep 5
done

echo "[OK] NameNode is reachable."
echo "[START] Launching DataNode ..."
exec hdfs datanode
