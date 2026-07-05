# =============================================================================
# Flume Docker 镜像
# 基于 eclipse-temurin:8-jre，安装 Apache Flume 1.11.0
# =============================================================================
FROM eclipse-temurin:8-jre

ENV FLUME_VERSION=1.11.0
ENV FLUME_HOME=/opt/flume
ENV FLUME_AGENT_NAME=a1
ENV FLUME_CONF_FILE=/opt/flume/conf/flume.conf
ENV PATH=$PATH:$FLUME_HOME/bin

# 安装 curl（wait-for 脚本用）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 下载并解压 Flume
RUN curl -fSL "https://dlcdn.apache.org/flume/${FLUME_VERSION}/apache-flume-${FLUME_VERSION}-bin.tar.gz" \
        -o /tmp/flume.tar.gz \
    && tar -xzf /tmp/flume.tar.gz -C /opt \
    && mv /opt/apache-flume-${FLUME_VERSION}-bin $FLUME_HOME \
    && rm /tmp/flume.tar.gz

# 只删 hbase jar（Flume 自带的 Hadoop jar 保留，写 HDFS 需要它们）
RUN rm -f $FLUME_HOME/lib/hbase-*.jar

# =========================================================================
# 补充 Hadoop 3.3.6 依赖（Flume 1.11.0 不自带这些，但 HDFS Sink 需要）
# 逐个下载已验证必要的 jar：
# =========================================================================
RUN cd $FLUME_HOME/lib \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-common/3.3.6/hadoop-common-3.3.6.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-hdfs-client/3.3.6/hadoop-hdfs-client-3.3.6.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-auth/3.3.6/hadoop-auth-3.3.6.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-annotations/3.3.6/hadoop-annotations-3.3.6.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/hadoop/thirdparty/hadoop-shaded-guava/1.1.1/hadoop-shaded-guava-1.1.1.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/hadoop/thirdparty/hadoop-shaded-protobuf_3_7/1.1.1/hadoop-shaded-protobuf_3_7-1.1.1.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/com/fasterxml/woodstox/woodstox-core/5.4.0/woodstox-core-5.4.0.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/codehaus/woodstox/stax2-api/4.2.1/stax2-api-4.2.1.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/org/apache/commons/commons-configuration2/2.9.0/commons-configuration2-2.9.0.jar" \
    && curl -sfLO "https://repo1.maven.org/maven2/commons-beanutils/commons-beanutils/1.9.4/commons-beanutils-1.9.4.jar"

# 工作目录
WORKDIR $FLUME_HOME

# 启动脚本
COPY docker/flume/start-flume.sh /opt/flume/bin/start-flume.sh
RUN chmod +x /opt/flume/bin/start-flume.sh

ENTRYPOINT ["/opt/flume/bin/start-flume.sh"]
