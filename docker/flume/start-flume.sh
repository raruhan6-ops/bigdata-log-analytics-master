#!/bin/bash
# =============================================================================
# Flume Agent 启动脚本 — 由 run_pipeline.sh 调用
# 用法: start-flume.sh <conf-file> [agent-name]
# =============================================================================
CONF_FILE="${1:-/opt/flume/conf/taildir-kafka.conf}"
AGENT_NAME="${2:-a1}"

echo "========================================"
echo "  Flume Agent Startup"
echo "========================================"
echo "  Config: $CONF_FILE"
echo "  Agent:  $AGENT_NAME"

# 等待 Kafka 就绪（如果有 Kafka sink）
if grep -q "kafka" "$CONF_FILE" 2>/dev/null; then
    KAFKA_BROKER=$(grep "bootstrap.servers" "$CONF_FILE" | head -1 | sed 's/.*=\s*//')
    if [ -n "$KAFKA_BROKER" ]; then
        KAFKA_HOST="${KAFKA_BROKER%%:*}"
        KAFKA_PORT="${KAFKA_BROKER##*:}"
        echo "[WAIT] Waiting for Kafka ($KAFKA_HOST:$KAFKA_PORT) ..."
        for i in $(seq 1 30); do
            (echo >/dev/tcp/$KAFKA_HOST/$KAFKA_PORT) 2>/dev/null && break
            echo "       Kafka not ready, retry $i/30 ..."
            sleep 5
        done
        echo "[OK] Proceeding."
    fi
fi

# flume-ng 脚本硬编码 JAVA_OPTS="-Xmx20m"，太小了，HDFS sink 至少需要 256MB
# 通过 FLUME_JAVA_OPTS 覆写（JVM 使用最后一个 -Xmx 值）
if [ -z "$FLUME_JAVA_OPTS" ]; then
    export FLUME_JAVA_OPTS="-Xmx512m -Xms128m"
fi

echo "[START] Launching Flume Agent (FLUME_JAVA_OPTS=$FLUME_JAVA_OPTS) ..."
exec flume-ng agent \
    -n "$AGENT_NAME" \
    -c /opt/flume/conf \
    -f "$CONF_FILE" \
    -Dflume.root.logger=INFO,console
