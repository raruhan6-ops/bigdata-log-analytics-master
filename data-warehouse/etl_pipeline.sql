-- =============================================================================
-- 大数据日志分析平台 — ETL 管道
-- ODS → DWD → DWS → ADS
--
-- 执行: beeline -u jdbc:hive2://localhost:10000 \
--        --hiveconf etl_date=YYYY-MM-DD \
--        -f etl_pipeline.sql
-- =============================================================================
USE log_dw;

-- ============================
-- Step 1: ODS → DWD 页面浏览明细
-- ============================
INSERT OVERWRITE TABLE dwd_page_view PARTITION(dt='${hiveconf:etl_date}')
SELECT
    remote_addr                                          AS ip,
    '未知'                                               AS province,
    '未知'                                               AS city,
    CAST(from_unixtime(unix_timestamp(time_local, 'dd/MMM/yyyy:HH:mm:ss Z')) AS TIMESTAMP) AS ts,
    regexp_extract(request, '^(\\S+)', 1)                 AS method,
    regexp_extract(request, '(\\S+)', 1)                  AS url,
    regexp_extract(request, ' ([^ ?]*)', 1)               AS url_path,
    regexp_extract(request, '\\?([^ ]*)', 1)              AS url_query,
    status,
    body_bytes_sent,
    http_referer                                          AS referer,
    regexp_extract(http_referer, '://([^/]+)', 1)         AS referer_domain,
    http_user_agent                                       AS ua,
    CASE
        WHEN http_user_agent LIKE '%Mobile%'
          OR http_user_agent LIKE '%Android%'
          OR http_user_agent LIKE '%iPhone%'              THEN 'Mobile'
        WHEN http_user_agent LIKE '%iPad%'
          OR http_user_agent LIKE '%Tablet%'              THEN 'Tablet'
        ELSE 'PC'
    END                                                   AS terminal,
    CASE
        WHEN http_user_agent LIKE '%Firefox%'             THEN 'Firefox'
        WHEN http_user_agent LIKE '%Edg%'                 THEN 'Edge'
        WHEN http_user_agent LIKE '%Chrome%'              THEN 'Chrome'
        WHEN http_user_agent LIKE '%Safari%'              THEN 'Safari'
        ELSE 'Other'
    END                                                   AS browser,
    CASE
        WHEN http_user_agent LIKE '%Windows%'             THEN 'Windows'
        WHEN http_user_agent LIKE '%Mac%'                 THEN 'Mac'
        WHEN http_user_agent LIKE '%Linux%'               THEN 'Linux'
        WHEN http_user_agent LIKE '%iPhone%'
          OR http_user_agent LIKE '%iPad%'                THEN 'iOS'
        WHEN http_user_agent LIKE '%Android%'             THEN 'Android'
        ELSE 'Other'
    END                                                   AS os,
    FALSE                                                 AS is_bounce
FROM ods_access_log
WHERE dt = '${hiveconf:etl_date}';


-- ============================
-- Step 2: DWD → DWS 小时级 PV/UV
-- ============================
INSERT OVERWRITE TABLE dws_pv_uv_hourly PARTITION(dt='${hiveconf:etl_date}')
SELECT
    DATE_FORMAT(ts, 'yyyy-MM-dd HH') AS dt_hour,
    COUNT(1)                          AS pv,
    COUNT(DISTINCT ip)                AS uv,
    COUNT(DISTINCT ip)                AS ip_count
FROM dwd_page_view
WHERE dt = '${hiveconf:etl_date}'
GROUP BY DATE_FORMAT(ts, 'yyyy-MM-dd HH');


-- ============================
-- Step 3: DWD → DWS 页面排行
-- ============================
INSERT OVERWRITE TABLE dws_page_rank_daily PARTITION(dt='${hiveconf:etl_date}')
SELECT
    url_path,
    ''                              AS page_name,
    COUNT(1)                        AS pv,
    COUNT(DISTINCT ip)              AS uv,
    ROW_NUMBER() OVER (ORDER BY COUNT(1) DESC) AS rank_pos
FROM dwd_page_view
WHERE dt = '${hiveconf:etl_date}'
GROUP BY url_path;


-- ============================
-- Step 4: DWD → DWS 终端分布
-- ============================
INSERT OVERWRITE TABLE dws_terminal_dist PARTITION(dt='${hiveconf:etl_date}')
SELECT
    terminal AS term_type,
    COUNT(1) AS pv
FROM dwd_page_view
WHERE dt = '${hiveconf:etl_date}'
GROUP BY terminal;


-- ============================
-- Step 5: DWD → DWS 浏览器分布
-- ============================
INSERT OVERWRITE TABLE dws_browser_dist PARTITION(dt='${hiveconf:etl_date}')
SELECT
    browser AS browser,
    COUNT(1) AS pv
FROM dwd_page_view
WHERE dt = '${hiveconf:etl_date}'
GROUP BY browser;


-- ============================
-- Step 6: DWD → ADS KPI 日指标
-- ============================
INSERT OVERWRITE TABLE ads_kpi_daily
SELECT
    '${hiveconf:etl_date}'                           AS dt,
    COUNT(1)                                          AS pv,
    COUNT(DISTINCT ip)                                AS uv,
    COUNT(DISTINCT ip)                                AS ip_count,
    COUNT(1)                                          AS sessions,
    ROUND(AVG(1), 2)                                  AS avg_depth,
    ROUND(0, 2)                                       AS bounce_rate
FROM dwd_page_view
WHERE dt = '${hiveconf:etl_date}';


-- ============================
-- 验证
-- ============================
SELECT '=== DWD 页面明细 ===' AS step;
SELECT COUNT(*) AS dwd_count FROM dwd_page_view WHERE dt='${hiveconf:etl_date}';

SELECT '=== DWS 小时汇总 ===' AS step;
SELECT COUNT(*) AS dws_hourly_count FROM dws_pv_uv_hourly WHERE dt='${hiveconf:etl_date}';

SELECT '=== DWS 页面排行 TOP 10 ===' AS step;
SELECT * FROM dws_page_rank_daily WHERE dt='${hiveconf:etl_date}' ORDER BY rank_pos LIMIT 10;

SELECT '=== DWS 终端分布 ===' AS step;
SELECT * FROM dws_terminal_dist WHERE dt='${hiveconf:etl_date}';

SELECT '=== DWS 浏览器分布 ===' AS step;
SELECT * FROM dws_browser_dist WHERE dt='${hiveconf:etl_date}';

SELECT '=== ADS KPI 日指标 ===' AS step;
SELECT * FROM ads_kpi_daily;

SELECT 'ETL OK: ${hiveconf:etl_date}' AS status;
