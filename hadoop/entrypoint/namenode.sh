#!/bin/bash
# =============================================================================
# NameNode 启动脚本
# 首次启动自动格式化，之后直接启动 NameNode
# =============================================================================
set -e

NAMENODE_DIR="/data/hdfs/namenode"
VERSION_FILE="$NAMENODE_DIR/current/VERSION"

echo "========================================"
echo "  Hadoop NameNode Startup"
echo "========================================"

# 确保数据目录存在且有正确权限
mkdir -p "$NAMENODE_DIR" 2>/dev/null || true

# 首次启动：格式化 NameNode
if [ ! -f "$VERSION_FILE" ]; then
    echo "[INIT] First run — formatting NameNode ..."
    hdfs namenode -format -force -nonInteractive
    echo "[INIT] Format complete."
else
    echo "[OK] NameNode already formatted, skipping format."
fi

echo "[START] Launching NameNode ..."
exec hdfs namenode
