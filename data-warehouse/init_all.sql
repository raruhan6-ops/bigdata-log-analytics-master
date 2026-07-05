-- =============================================================================
-- 大数据日志分析平台 — 数据仓库建表脚本
--
-- 分层: ODS（原始层）→ DWD（明细层）→ DWS（汇总层）→ ADS（应用层）
--
-- 执行方式:
--   hive -f data-warehouse/init_all.sql
--   或 spark-sql -f data-warehouse/init_all.sql
-- =============================================================================

-- ============================
-- 1. 创建数据库
-- ============================
CREATE DATABASE IF NOT EXISTS log_dw
COMMENT '日志分析数据仓库';
USE log_dw;


-- ============================
-- 2. ODS 层 — 原始日志外部表
-- ============================
-- 说明：ODS 层不修改数据，仅通过分区指向 HDFS 上的原始日志文件。
--       实际部署时，Flume → Kafka → HDFS Sink 按日期写入 HDFS。
--       每天凌晨调度任务执行 ALTER TABLE ADD PARTITION 挂载新一天的日志。

-- 2.1 原始日志表（按日期分区）
DROP TABLE IF EXISTS ods_access_log;
CREATE EXTERNAL TABLE ods_access_log (
    remote_addr     STRING COMMENT '客户端 IP',
    remote_user     STRING COMMENT '远程用户（通常为空 -）',
    time_local      STRING COMMENT '请求时间（原始字符串）',
    request         STRING COMMENT '请求行（GET /path HTTP/1.1）',
    status          INT    COMMENT 'HTTP 状态码',
    body_bytes_sent INT    COMMENT '响应体大小',
    http_referer    STRING COMMENT 'Referer 来源',
    http_user_agent STRING COMMENT 'User-Agent',
    session_id      STRING COMMENT '客户端 Session UUID'
)
PARTITIONED BY (dt STRING COMMENT '日期分区，格式 YYYY-MM-DD')
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
    "input.regex" = '^([^ ]+) (?:[^ ]+) ([^ ]+) \\[([^\\]]+)\\] "([^"]*)" ([0-9]+) ([0-9-]+) "([^"]*)" "([^"]*)"(?: "([^"]*)")?$'
)
STORED AS TEXTFILE
LOCATION '/data/log_dw/ods/access_log'
TBLPROPERTIES ('skip.header.line.count'='0');


-- ============================
-- 3. DWD 层 — 清洗后明细数据
-- ============================
-- 说明：DWD 层对 ODS 数据进行清洗、解析、拆分。
--       - 解析时间字段
--       - 拆解请求行为 method, url, protocol
--       - 标记终端类型（PC/Mobile/Tablet）
--       - 解析浏览器
--       - 解析操作系统
--       - IP 转地域（需配合 UDF）

-- 3.1 页面浏览明细表
DROP TABLE IF EXISTS dwd_page_view;
CREATE TABLE dwd_page_view (
    ip              STRING    COMMENT '客户端 IP',
    session_id      STRING    COMMENT '会话 ID',
    province        STRING    COMMENT '省份',
    city            STRING    COMMENT '城市',
    ts              TIMESTAMP COMMENT '请求时间戳',
    method          STRING    COMMENT 'HTTP 方法（GET/POST/...）',
    url             STRING    COMMENT '请求路径',
    url_path        STRING    COMMENT '路径（不含参数）',
    url_query       STRING    COMMENT '查询参数',
    search_keyword  STRING    COMMENT '搜索关键词',
    status          INT       COMMENT 'HTTP 状态码',
    body_bytes_sent INT       COMMENT '响应大小',
    referer         STRING    COMMENT 'Referer',
    referer_domain  STRING    COMMENT 'Referer 域名',
    ua              STRING    COMMENT 'User-Agent 原始字符串',
    terminal        STRING    COMMENT '终端类型：PC/Mobile/Tablet/Unknown',
    browser         STRING    COMMENT '浏览器：Chrome/Firefox/Safari/Edge/Other',
    os              STRING    COMMENT '操作系统：Windows/Mac/Linux/iOS/Android/Other',
    is_bounce       BOOLEAN   COMMENT '是否跳出（单页会话）'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- ETL SQL（从 ODS 清洗到 DWD）
-- 说明：此 SQL 每天凌晨由 DolphinScheduler 或 spark-sql 调度执行
-- INSERT OVERWRITE TABLE dwd_page_view PARTITION(dt='${yesterday}')
-- SELECT
--     remote_addr                                          AS ip,
--     session_id                                           AS session_id,
--     '未知'                                               AS province,          -- TODO: UDF 翻译
--     '未知'                                               AS city,
--     from_unixtime(unix_timestamp(time_local,
--         'dd/MMM/yyyy:HH:mm:ss Z'), 'yyyy-MM-dd HH:mm:ss') AS ts,
--     regexp_extract(request, '^(\\S+)', 1)                 AS method,
--     regexp_extract(request, '\\s+(\\S+)\\s+', 1)          AS url,
--     regexp_extract(request, '\\s+(/[^?]*)', 1)            AS url_path,
--     regexp_extract(request, '\\?(.*)\\s+HTTP', 1)         AS url_query,
--     parse_url(concat('http://localhost', regexp_extract(request, '\\s+(\\S+)\\s+', 1)), 'QUERY', 'q') AS search_keyword,
--     status,
--     body_bytes_sent,
--     http_referer                                          AS referer,
--     regexp_extract(http_referer, '://([^/]+)', 1)         AS referer_domain,
--     http_user_agent                                       AS ua,
--     CASE
--         WHEN http_user_agent LIKE '%Mobile%'
--           OR http_user_agent LIKE '%Android%'
--           OR http_user_agent LIKE '%iPhone%'              THEN 'Mobile'
--         WHEN http_user_agent LIKE '%iPad%'
--           OR http_user_agent LIKE '%Tablet%'              THEN 'Tablet'
--         ELSE 'PC'
--     END                                                   AS terminal,
--     CASE
--         WHEN http_user_agent LIKE '%Firefox%'             THEN 'Firefox'
--         WHEN http_user_agent LIKE '%Edge%'                THEN 'Edge'
--         WHEN http_user_agent LIKE '%Chrome%'              THEN 'Chrome'
--         WHEN http_user_agent LIKE '%Safari%'              THEN 'Safari'
--         ELSE 'Other'
--     END                                                   AS browser,
--     CASE
--         WHEN http_user_agent LIKE '%Windows%'             THEN 'Windows'
--         WHEN http_user_agent LIKE '%Mac%'                 THEN 'Mac'
--         WHEN http_user_agent LIKE '%Linux%'               THEN 'Linux'
--         WHEN http_user_agent LIKE '%iPhone%'
--           OR http_user_agent LIKE '%iPad%'                THEN 'iOS'
--         WHEN http_user_agent LIKE '%Android%'             THEN 'Android'
--         ELSE 'Other'
--     END                                                   AS os,
--     FALSE                                                 AS is_bounce
-- FROM ods_access_log
-- WHERE dt = '${yesterday}';

-- 3.2 会话明细表（Sessionization）
DROP TABLE IF EXISTS dwd_session;
CREATE TABLE dwd_session (
    session_id   STRING    COMMENT '会话 ID',
    ip           STRING    COMMENT '客户端 IP',
    start_ts     TIMESTAMP COMMENT '会话开始时间',
    end_ts       TIMESTAMP COMMENT '会话结束时间',
    duration_sec INT       COMMENT '会话时长（秒）',
    page_count   INT       COMMENT '会话内页面数',
    entry_page   STRING    COMMENT '入口页',
    exit_page    STRING    COMMENT '出口页',
    is_bounce    BOOLEAN   COMMENT '是否跳出（page_count=1）'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;

-- 会话还原 SQL（Spark 窗口函数方式）
-- 说明：相邻两次请求间隔 > 30 分钟视为新会话
-- INSERT OVERWRITE TABLE dwd_session PARTITION(dt='${yesterday}')
-- WITH session_marked AS (
--     SELECT
--         ip, ts, url_path,
--         CASE
--             WHEN unix_timestamp(ts) - unix_timestamp(
--                 LAG(ts) OVER (PARTITION BY ip ORDER BY ts)
--             ) > 1800 THEN 1
--             WHEN LAG(ip) OVER (ORDER BY ip, ts) IS NULL THEN 1
--             ELSE 0
--         END AS is_new_session
--     FROM dwd_page_view
--     WHERE dt = '${yesterday}'
-- ),
-- session_assigned AS (
--     SELECT
--         ip, ts, url_path,
--         CONCAT(ip, '_', SUM(is_new_session) OVER (
--             PARTITION BY ip ORDER BY ts
--             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
--         )) AS session_id
--     FROM session_marked
-- )
-- SELECT
--     session_id,
--     ip,
--     MIN(ts)              AS start_ts,
--     MAX(ts)              AS end_ts,
--     MAX(unix_timestamp(ts)) - MIN(unix_timestamp(ts)) AS duration_sec,
--     COUNT(1)             AS page_count,
--     FIRST_VALUE(url_path) OVER (PARTITION BY session_id ORDER BY ts) AS entry_page,
--     LAST_VALUE(url_path)  OVER (PARTITION BY session_id ORDER BY ts) AS exit_page,
--     COUNT(1) = 1         AS is_bounce
-- FROM session_assigned
-- GROUP BY session_id, ip;


-- ============================
-- 4. DWS 层 — 轻度汇总
-- ============================

-- 4.1 小时级 PV/UV/IP 汇总

DROP TABLE IF EXISTS dws_search_keyword_daily;
CREATE TABLE dws_search_keyword_daily (
    keyword  STRING COMMENT '搜索词',
    search_count BIGINT COMMENT '搜索次数'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;

-- INSERT OVERWRITE TABLE dws_search_keyword_daily PARTITION(dt='${yesterday}')
-- SELECT 
--     search_keyword AS keyword, 
--     COUNT(1) AS search_count 
-- FROM dwd_page_view 
-- WHERE dt = '${yesterday}' AND search_keyword IS NOT NULL AND search_keyword != '' 
-- GROUP BY search_keyword;

DROP TABLE IF EXISTS dws_pv_uv_hourly;
CREATE TABLE dws_pv_uv_hourly (
    dt_hour  STRING COMMENT '小时标签（YYYY-MM-DD HH）',
    pv       BIGINT COMMENT '页面浏览量',
    uv       BIGINT COMMENT '独立访客（IP 去重）',
    ip_count BIGINT COMMENT '独立 IP 数'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;

-- ETL SQL:
-- INSERT OVERWRITE TABLE dws_pv_uv_hourly PARTITION(dt='${yesterday}')
-- SELECT
--     DATE_FORMAT(ts, 'yyyy-MM-dd HH') AS dt_hour,
--     COUNT(1)                          AS pv,
--     COUNT(DISTINCT ip)                AS uv,
--     COUNT(DISTINCT ip)                AS ip_count
-- FROM dwd_page_view
-- WHERE dt = '${yesterday}'
-- GROUP BY DATE_FORMAT(ts, 'yyyy-MM-dd HH');

-- 4.2 页面排行（日级）
DROP TABLE IF EXISTS dws_page_rank_daily;
CREATE TABLE dws_page_rank_daily (
    url_path  STRING COMMENT '页面路径',
    page_name STRING COMMENT '页面名称',
    pv        BIGINT COMMENT '页面 PV',
    uv        BIGINT COMMENT '页面 UV',
    rank_pos  INT    COMMENT '排名'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;

-- ETL SQL:
-- INSERT OVERWRITE TABLE dws_page_rank_daily PARTITION(dt='${yesterday}')
-- SELECT
--     url_path,
--     ''                              AS page_name,
--     COUNT(1)                        AS pv,
--     COUNT(DISTINCT ip)              AS uv,
--     ROW_NUMBER() OVER (ORDER BY COUNT(1) DESC) AS rank_pos
-- FROM dwd_page_view
-- WHERE dt = '${yesterday}'
-- GROUP BY url_path;

-- 4.3 终端/浏览器分布（日级）
DROP TABLE IF EXISTS dws_terminal_dist;
CREATE TABLE dws_terminal_dist (
    term_type  STRING COMMENT 'PC/Mobile/Tablet',
    pv         BIGINT COMMENT 'PV 量'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;

DROP TABLE IF EXISTS dws_browser_dist;
CREATE TABLE dws_browser_dist (
    browser STRING COMMENT '浏览器名称',
    pv      BIGINT COMMENT 'PV 量'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;


-- ============================
-- 5. ADS 层 — 应用指标（对接 MySQL）
-- ============================

-- 5.0 搜索关键词排行
DROP TABLE IF EXISTS ads_top_search_keywords;
CREATE TABLE ads_top_search_keywords (
    dt          STRING COMMENT '日期',
    keyword     STRING COMMENT '关键词',
    search_count BIGINT COMMENT '搜索次数',
    rank_pos    INT    COMMENT '排名'
)
STORED AS PARQUET;

-- INSERT OVERWRITE TABLE ads_top_search_keywords
-- SELECT 
--     '${yesterday}' AS dt,
--     keyword, 
--     search_count,
--     ROW_NUMBER() OVER (ORDER BY search_count DESC) AS rank_pos
-- FROM dws_search_keyword_daily 
-- WHERE dt='${yesterday}' 
-- LIMIT 50;

-- 5.1 KPI 日指标宽表
DROP TABLE IF EXISTS ads_kpi_daily;
CREATE TABLE ads_kpi_daily (
    dt          STRING       COMMENT '日期',
    pv          BIGINT       COMMENT '日 PV',
    uv          BIGINT       COMMENT '日 UV',
    ip_count    BIGINT       COMMENT '独立 IP 数',
    sessions    BIGINT       COMMENT '会话数',
    avg_session_duration DECIMAL(8,2) COMMENT '平均会话时长(秒)',
    avg_depth   DECIMAL(6,2) COMMENT '平均访问深度',
    bounce_rate DECIMAL(5,2) COMMENT '跳出率(%)'
)
STORED AS PARQUET;

-- ETL SQL（汇总所有指标）:
-- INSERT OVERWRITE TABLE ads_kpi_daily
-- SELECT
--     '${yesterday}'                                               AS dt,
--     COUNT(1)                                                     AS pv,
--     COUNT(DISTINCT pv.ip)                                        AS uv,
--     COUNT(DISTINCT pv.ip)                                        AS ip_count,
--     COUNT(DISTINCT s.session_id)                                 AS sessions,
--     ROUND(AVG(s.duration_sec), 2)                                AS avg_session_duration,
--     ROUND(AVG(s.page_count), 2)                                  AS avg_depth,
--     ROUND(SUM(CASE WHEN s.is_bounce THEN 1 ELSE 0 END)
--         * 100.0 / COUNT(DISTINCT s.session_id), 2)               AS bounce_rate
-- FROM dwd_page_view pv
-- LEFT JOIN dwd_session s ON pv.ip = s.ip AND pv.dt = s.dt
-- WHERE pv.dt = '${yesterday}';

-- 5.2 页面价值与流失分析 (Feature 9)
DROP TABLE IF EXISTS ads_page_bounce_rate;
CREATE TABLE ads_page_bounce_rate (
    dt          STRING COMMENT '日期',
    url_path    STRING COMMENT '页面路径',
    entry_count BIGINT COMMENT '作为入口页的次数',
    bounce_count BIGINT COMMENT '从该页面跳出的次数',
    bounce_rate DECIMAL(5,2) COMMENT '单页跳出率(%)'
)
STORED AS PARQUET;

-- INSERT OVERWRITE TABLE ads_page_bounce_rate
-- SELECT 
--     '${yesterday}' AS dt,
--     entry_page AS url_path,
--     COUNT(1) AS entry_count,
--     SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END) AS bounce_count,
--     ROUND(SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END) * 100.0 / COUNT(1), 2) AS bounce_rate
-- FROM dwd_session
-- WHERE dt = '${yesterday}'
-- GROUP BY entry_page;


-- 5.3 用户留存分析 (Feature 7)
DROP TABLE IF EXISTS ads_user_retention;
CREATE TABLE ads_user_retention (
    dt            STRING COMMENT '日期',
    new_users     BIGINT COMMENT '当日新增用户数(基于IP/Session_id简化)',
    retention_1d  DECIMAL(5,2) COMMENT '次日留存率(%)',
    retention_3d  DECIMAL(5,2) COMMENT '3日留存率(%)',
    retention_7d  DECIMAL(5,2) COMMENT '7日留存率(%)'
)
STORED AS PARQUET;
-- 留存 SQL 需要跨多天 JOIN 取交集计算，此处留存表结构。

-- ============================
-- 6. 初始化完成标记
-- ============================
SELECT '✅ 数据仓库表结构初始化完成。' AS status;

-- 下一步:
--   1. Flume 将日志写入 HDFS: /data/log_dw/ods/access_log/dt=YYYY-MM-DD/
--   2. 添加分区: ALTER TABLE ods_access_log ADD PARTITION (dt='YYYY-MM-DD')
--               LOCATION '/data/log_dw/ods/access_log/dt=YYYY-MM-DD';
--   3. 运行 ETL: INSERT OVERWRITE TABLE dwd_page_view PARTITION(dt='...') SELECT ...
--   4. 逐层汇总: DWD → DWS → ADS → MySQL
