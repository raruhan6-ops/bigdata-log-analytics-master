-- 大数据日志分析平台 — MySQL 初始化脚本
-- 存储 KPI 聚合结果，供前端快速查询

CREATE TABLE IF NOT EXISTS kpi_daily (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    pv          BIGINT       NOT NULL DEFAULT 0 COMMENT '日 PV',
    uv          BIGINT       NOT NULL DEFAULT 0 COMMENT '日 UV（IP 去重近似值）',
    ip_count    BIGINT       NOT NULL DEFAULT 0 COMMENT '独立 IP 数',
    sessions    BIGINT       NOT NULL DEFAULT 0 COMMENT '会话数',
    avg_session_duration DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT '平均会话时长(秒)',
    avg_depth   DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT '平均访问深度（页/会话）',
    bounce_rate DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '跳出率（%）',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dt (dt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日 KPI 指标表';

CREATE TABLE IF NOT EXISTS kpi_hourly (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    hour        TINYINT      NOT NULL COMMENT '小时（0-23）',
    pv          BIGINT       NOT NULL DEFAULT 0,
    uv          BIGINT       NOT NULL DEFAULT 0,
    ip_count    BIGINT       NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dt_hour (dt, hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小时级 KPI 表';

CREATE TABLE IF NOT EXISTS top_pages (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    page_url    VARCHAR(512) NOT NULL COMMENT '页面路径',
    page_name   VARCHAR(256) DEFAULT '' COMMENT '页面名称',
    pv          BIGINT       NOT NULL DEFAULT 0 COMMENT '页面 PV',
    uv          BIGINT       NOT NULL DEFAULT 0 COMMENT '页面 UV',
    rank_pos    INT          NOT NULL DEFAULT 0 COMMENT '排名',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_dt (dt),
    KEY idx_dt_rank (dt, rank_pos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='热门页面排行表';

CREATE TABLE IF NOT EXISTS terminal_dist (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    term_type   VARCHAR(32)  NOT NULL COMMENT '终端类型：PC/Mobile/Tablet',
    pv          BIGINT       NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dt_type (dt, term_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='终端分布表';

CREATE TABLE IF NOT EXISTS browser_dist (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    browser     VARCHAR(64)  NOT NULL COMMENT '浏览器名称',
    pv          BIGINT       NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dt_browser (dt, browser)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='浏览器分布表';

CREATE TABLE IF NOT EXISTS top_search_keywords (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    keyword     VARCHAR(256) NOT NULL COMMENT '搜索关键词',
    search_count BIGINT      NOT NULL DEFAULT 0 COMMENT '搜索次数',
    rank_pos    INT          NOT NULL DEFAULT 0 COMMENT '排名',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_dt (dt),
    KEY idx_dt_rank (dt, rank_pos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='热门搜索关键词表';

CREATE TABLE IF NOT EXISTS page_bounce_rate (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt          DATE         NOT NULL COMMENT '数据日期',
    url_path    VARCHAR(512) NOT NULL COMMENT '页面路径',
    entry_count BIGINT       NOT NULL DEFAULT 0 COMMENT '入口页次数',
    bounce_count BIGINT      NOT NULL DEFAULT 0 COMMENT '跳出次数',
    bounce_rate DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '单页跳出率(%)',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_dt (dt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='高优页面流失率分析表';

CREATE TABLE IF NOT EXISTS user_retention (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    dt            DATE         NOT NULL COMMENT '数据日期',
    new_users     BIGINT       NOT NULL DEFAULT 0 COMMENT '当日新增(近似)',
    retention_1d  DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '次日留存',
    retention_3d  DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '3日留存',
    retention_7d  DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '7日留存',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dt (dt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户留存表';
