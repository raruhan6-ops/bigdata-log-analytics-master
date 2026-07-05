"""
=============================================================================
日志解析器 — 读取 .log 文件，解析入库（SQLite）

支持格式:
    Combined: IP - - [时间] "请求" 状态码 字节数 "Referer" "User-Agent"
    Common:   IP - - [时间] "请求" 状态码 字节数

用法:
    python scripts/parse_logs.py
    python scripts/parse_logs.py --log-dir ./data/logs --db ./data/log_analytics.db
=============================================================================
"""
import argparse
import os
import re
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime

try:
    import pymysql
    HAS_PYMYSQL = True
except ImportError:
    HAS_PYMYSQL = False


# ---------- 日志行正则 ----------
# 两组正则：先试 Combined（9 字段），不行再试 Common（7 字段）
RE_COMBINED = re.compile(
    r'^(\S+) - - \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d+) (\d+) "([^"]*)" "([^"]*)"'
)
RE_COMMON = re.compile(
    r'^(\S+) - - \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d+) (\d+)\s*$'
)


def parse_ua(ua_string):
    """从 User-Agent 解析终端类型和浏览器，Unknown 表示 Common 格式无此字段"""
    if not ua_string or ua_string == "-":
        return "Unknown", "Unknown"

    term = "PC"
    if any(k in ua_string for k in ("iPhone", "Android", "Mobile")):
        term = "Mobile"
    elif any(k in ua_string for k in ("iPad", "Tablet")):
        term = "Tablet"

    if "Edge" in ua_string:
        browser = "Edge"
    elif "Chrome" in ua_string:
        browser = "Chrome"
    elif "Firefox" in ua_string:
        browser = "Firefox"
    elif "Safari" in ua_string:
        browser = "Safari"
    else:
        browser = "Other"

    # OS
    if "Windows" in ua_string:
        os_name = "Windows"
    elif "Mac" in ua_string:
        os_name = "macOS"
    elif "iPhone" in ua_string or "iPad" in ua_string:
        os_name = "iOS"
    elif "Android" in ua_string:
        os_name = "Android"
    elif "Linux" in ua_string:
        os_name = "Linux"
    else:
        os_name = "Other"

    return term, browser, os_name


def parse_time(time_str):
    """解析日志时间字符串 -> datetime 对象"""
    try:
        return datetime.strptime(time_str, "%d/%b/%Y:%H:%M:%S +0800")
    except ValueError:
        return None


def parse_log_file(filepath):
    """解析单个日志文件，返回 (records, line_count, error_count)"""
    records = []
    line_count = 0
    error_count = 0

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            line_count += 1

            # 先试 Combined，再试 Common
            m = RE_COMBINED.match(line)
            if m:
                ip, time_str, method, url, status, body_bytes, referer, ua = m.groups()
            else:
                m = RE_COMMON.match(line)
                if m:
                    ip, time_str, method, url, status, body_bytes = m.groups()
                    referer = "-"
                    ua = "-"
                else:
                    error_count += 1
                    continue

            ts = parse_time(time_str)
            if not ts:
                error_count += 1
                continue

            terminal, browser, os_name = parse_ua(ua)

            records.append({
                "ip": ip,
                "ts": ts,
                "method": method,
                "url": url,
                "url_path": url.split("?")[0],
                "status": int(status),
                "body_bytes": int(body_bytes),
                "referer": referer,
                "referer_domain": _extract_referer_domain(referer),
                "ua": ua,
                "terminal": terminal,
                "browser": browser,
                "os_name": os_name,
            })

    return records, line_count, error_count


def _extract_referer_domain(referer):
    if not referer or referer == "-":
        return "direct"
    m = re.search(r"://([^/:]+)", referer)
    return m.group(1) if m else "other"


def _get_conn(db_type, db_path):
    """根据类型获取数据库连接，MySQL 模式下自动建库建用户"""
    if db_type == "mysql":
        if not HAS_PYMYSQL:
            print("错误: 需要安装 pymysql: pip install pymysql")
            raise SystemExit(1)
        host = os.getenv("MYSQL_HOST", "localhost")
        port = int(os.getenv("MYSQL_PORT", "3306"))
        user = os.getenv("MYSQL_USER", "loguser")
        password = os.getenv("MYSQL_PASSWORD", "logpass123")
        database = os.getenv("MYSQL_DATABASE", "log_analytics")

        # 1. 尝试用应用用户直连
        try:
            conn = pymysql.connect(
                host=host, port=port, user=user, password=password,
                database=database, charset="utf8mb4",
            )
            return conn
        except pymysql.err.OperationalError:
            pass  # 库或用户不存在，尝试初始化

        # 2. 用 root 自动建库建用户
        root_pw = os.getenv("MYSQL_ROOT_PASSWORD", "")
        if not root_pw:
            print("  提示: 设置 MYSQL_ROOT_PASSWORD 环境变量可自动建库（仅需一次）")
            raise

        print("  数据库不存在，正在自动初始化...")
        try:
            root_conn = pymysql.connect(
                host=host, port=port, user="root", password=root_pw,
                charset="utf8mb4",
            )
            rc = root_conn.cursor()
            rc.execute(
                f"CREATE DATABASE IF NOT EXISTS `{database}` "
                f"DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            rc.execute(
                f"CREATE USER IF NOT EXISTS '{user}'@'%' "
                f"IDENTIFIED BY '{password}'"
            )
            rc.execute(
                f"CREATE USER IF NOT EXISTS '{user}'@'localhost' "
                f"IDENTIFIED BY '{password}'"
            )
            rc.execute(f"GRANT ALL PRIVILEGES ON `{database}`.* TO '{user}'@'%'")
            rc.execute(f"GRANT ALL PRIVILEGES ON `{database}`.* TO '{user}'@'localhost'")
            rc.execute("FLUSH PRIVILEGES")
            root_conn.commit()
            root_conn.close()
            print(f"  [OK] 数据库 {database} 和用户 {user} 已创建")
        except pymysql.err.OperationalError as e:
            print(f"  [ERROR] root 连接失败: {e}")
            raise

        # 3. 重新用应用用户连接
        conn = pymysql.connect(
            host=host, port=port, user=user, password=password,
            database=database, charset="utf8mb4",
        )
        return conn
    else:
        return sqlite3.connect(db_path)


def aggregate_and_store(records, db_path, db_type="sqlite"):
    """聚合数据并写入数据库"""
    conn = _get_conn(db_type, db_path)
    cursor = conn.cursor()

    _create_tables(cursor, db_type)

    # ---- 按日期分组 ----
    by_date = defaultdict(list)
    for r in records:
        dt = r["ts"].strftime("%Y-%m-%d")
        by_date[dt].append(r)

    for dt, day_records in by_date.items():
        print(f"  处理日期: {dt} ({len(day_records):,} 条)")

        # ---- 日级 KPI ----
        ips = set(r["ip"] for r in day_records)
        pv = len(day_records)
        uv = len(ips)
        _upsert(cursor, db_type, "kpi_daily",
                ["dt", "pv", "uv", "ip_count"],
                [dt, pv, uv, uv],
                ["dt"])

        # ---- 小时级 KPI ----
        by_hour = defaultdict(list)
        for r in day_records:
            by_hour[r["ts"].hour].append(r)
        for hour, h_records in by_hour.items():
            h_ips = set(r["ip"] for r in h_records)
            _upsert(cursor, db_type, "kpi_hourly",
                    ["dt", "hour", "pv", "uv", "ip_count"],
                    [dt, hour, len(h_records), len(h_ips), len(h_ips)],
                    ["dt", "hour"])

        # ---- 页面排行 ----
        page_counter = Counter(r["url_path"] for r in day_records)
        for rank, (url_path, count) in enumerate(page_counter.most_common(20), 1):
            _upsert(cursor, db_type, "top_pages",
                    ["dt", "page_url", "pv", "rank_pos"],
                    [dt, url_path, count, rank],
                    ["dt", "page_url"])

        # ---- 终端分布 ----
        term_counter = Counter(r["terminal"] for r in day_records)
        for term, count in term_counter.items():
            _upsert(cursor, db_type, "terminal_dist",
                    ["dt", "term_type", "pv"],
                    [dt, term, count],
                    ["dt", "term_type"])

        # ---- 浏览器分布 ----
        browser_counter = Counter(r["browser"] for r in day_records)
        for browser, count in browser_counter.items():
            _upsert(cursor, db_type, "browser_dist",
                    ["dt", "browser", "pv"],
                    [dt, browser, count],
                    ["dt", "browser"])

        # ---- OS 分布 (Feature 10) ----
        os_counter = Counter(r["os_name"] for r in day_records)
        for os_name, count in os_counter.items():
            _upsert(cursor, db_type, "os_dist",
                    ["dt", "os_name", "pv"],
                    [dt, os_name, count],
                    ["dt", "os_name"])

        # ---- 会话时长分布 (Feature 7) ----
        # 按 IP 模拟会话：同一 IP 的相邻请求间隔 > 30 min 视为新会话
        ip_records = defaultdict(list)
        for r in day_records:
            ip_records[r["ip"]].append(r["ts"])

        duration_buckets = {"0-10s": 0, "10-30s": 0, "30-60s": 0, "1-5min": 0, "5min+": 0}
        bucket_order_map = {"0-10s": 1, "10-30s": 2, "30-60s": 3, "1-5min": 4, "5min+": 5}

        for ip, timestamps in ip_records.items():
            timestamps.sort()
            session_start = timestamps[0]
            for i in range(1, len(timestamps)):
                gap = (timestamps[i] - timestamps[i-1]).total_seconds()
                if gap > 1800:  # 30 min
                    dur = (timestamps[i-1] - session_start).total_seconds()
                    if dur <= 10:
                        duration_buckets["0-10s"] += 1
                    elif dur <= 30:
                        duration_buckets["10-30s"] += 1
                    elif dur <= 60:
                        duration_buckets["30-60s"] += 1
                    elif dur <= 300:
                        duration_buckets["1-5min"] += 1
                    else:
                        duration_buckets["5min+"] += 1
                    session_start = timestamps[i]
            # last session
            dur = (timestamps[-1] - session_start).total_seconds()
            if dur <= 10:
                duration_buckets["0-10s"] += 1
            elif dur <= 30:
                duration_buckets["10-30s"] += 1
            elif dur <= 60:
                duration_buckets["30-60s"] += 1
            elif dur <= 300:
                duration_buckets["1-5min"] += 1
            else:
                duration_buckets["5min+"] += 1

        for bucket, count in duration_buckets.items():
            _upsert(cursor, db_type, "session_duration_dist",
                    ["dt", "duration_bucket", "session_count", "bucket_order"],
                    [dt, bucket, count, bucket_order_map[bucket]],
                    ["dt", "duration_bucket"])

    conn.commit()
    conn.close()


def _upsert(cursor, db_type, table, columns, values, key_cols):
    """插入或更新 — SQLite 用 REPLACE，MySQL 用 ON DUPLICATE KEY UPDATE"""
    if db_type == "mysql":
        placeholders = ", ".join(["%s"] * len(values))
        cols_str = ", ".join(columns)
        updates = ", ".join(f"{c} = VALUES({c})" for c in columns if c not in key_cols)
        sql = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {updates}"
    else:
        placeholders = ", ".join(["?"] * len(values))
        cols_str = ", ".join(columns)
        sql = f"INSERT OR REPLACE INTO {table} ({cols_str}) VALUES ({placeholders})"
    cursor.execute(sql, values)


def _create_tables(cursor, db_type="sqlite"):
    """建表"""
    if db_type == "mysql":
        _create_tables_mysql(cursor)
    else:
        _create_tables_sqlite(cursor)


def _create_tables_sqlite(cursor):
    """SQLite 建表"""
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS kpi_daily (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            dt      TEXT    NOT NULL UNIQUE,
            pv      INTEGER NOT NULL DEFAULT 0,
            uv      INTEGER NOT NULL DEFAULT 0,
            ip_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS kpi_hourly (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            dt      TEXT    NOT NULL,
            hour    INTEGER NOT NULL,
            pv      INTEGER NOT NULL DEFAULT 0,
            uv      INTEGER NOT NULL DEFAULT 0,
            ip_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            UNIQUE(dt, hour)
        );

        CREATE TABLE IF NOT EXISTS top_pages (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            dt       TEXT    NOT NULL,
            page_url TEXT    NOT NULL,
            page_name TEXT   DEFAULT '',
            pv       INTEGER NOT NULL DEFAULT 0,
            uv       INTEGER NOT NULL DEFAULT 0,
            rank_pos INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS terminal_dist (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            dt        TEXT    NOT NULL,
            term_type TEXT    NOT NULL,
            pv        INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            UNIQUE(dt, term_type)
        );

        CREATE TABLE IF NOT EXISTS browser_dist (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            dt      TEXT    NOT NULL,
            browser TEXT    NOT NULL,
            pv      INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            UNIQUE(dt, browser)
        );

        CREATE TABLE IF NOT EXISTS os_dist (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            dt      TEXT    NOT NULL,
            os_name TEXT    NOT NULL,
            pv      INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            UNIQUE(dt, os_name)
        );

        CREATE TABLE IF NOT EXISTS session_duration_dist (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            dt            TEXT    NOT NULL,
            duration_bucket TEXT  NOT NULL,
            session_count INTEGER NOT NULL DEFAULT 0,
            bucket_order  INTEGER NOT NULL DEFAULT 0,
            created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            UNIQUE(dt, duration_bucket)
        );
    """)


def _create_tables_mysql(cursor):
    """MySQL 建表"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kpi_daily (
            id      INT PRIMARY KEY AUTO_INCREMENT,
            dt      VARCHAR(10) NOT NULL UNIQUE,
            pv      INT NOT NULL DEFAULT 0,
            uv      INT NOT NULL DEFAULT 0,
            ip_count INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kpi_hourly (
            id      INT PRIMARY KEY AUTO_INCREMENT,
            dt      VARCHAR(10) NOT NULL,
            hour    INT NOT NULL,
            pv      INT NOT NULL DEFAULT 0,
            uv      INT NOT NULL DEFAULT 0,
            ip_count INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_dt_hour (dt, hour)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS top_pages (
            id       INT PRIMARY KEY AUTO_INCREMENT,
            dt       VARCHAR(10) NOT NULL,
            page_url VARCHAR(500) NOT NULL,
            page_name VARCHAR(100) DEFAULT '',
            pv       INT NOT NULL DEFAULT 0,
            uv       INT NOT NULL DEFAULT 0,
            rank_pos INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_dt_url (dt, page_url)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS terminal_dist (
            id        INT PRIMARY KEY AUTO_INCREMENT,
            dt        VARCHAR(10) NOT NULL,
            term_type VARCHAR(50) NOT NULL,
            pv        INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_dt_term (dt, term_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS browser_dist (
            id      INT PRIMARY KEY AUTO_INCREMENT,
            dt      VARCHAR(10) NOT NULL,
            browser VARCHAR(50) NOT NULL,
            pv      INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_dt_browser (dt, browser)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)


def main():
    parser = argparse.ArgumentParser(description="解析 Nginx 日志并写入数据库")
    parser.add_argument("--log-dir", default="./data/logs", help="日志目录（默认 ./data/logs）")
    parser.add_argument("--db", default="./data/log_analytics.db", help="SQLite 数据库路径（--db-type sqlite 时有效）")
    parser.add_argument("--db-type", default="sqlite", choices=["sqlite", "mysql"],
                        help="数据库类型：sqlite | mysql（默认 sqlite）")
    args = parser.parse_args()

    # MySQL 模式下从 .env 读配置
    if args.db_type == "mysql":
        # 尝试加载 .env
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        print(f"  数据库: MySQL ({os.getenv('MYSQL_HOST', 'localhost')}:{os.getenv('MYSQL_PORT', '3306')}/{os.getenv('MYSQL_DATABASE', 'log_analytics')})")
    else:
        print(f"  数据库:   {args.db}")

    log_dir = args.log_dir
    if not os.path.isdir(log_dir):
        print(f"错误: 日志目录不存在: {log_dir}")
        return

    log_files = sorted([
        f for f in os.listdir(log_dir) if f.endswith(".log") or f.endswith(".txt")
    ])
    if not log_files:
        print(f"错误: {log_dir} 中没有 .log 文件")
        return

    print(f"日志解析器启动")
    print(f"  日志目录: {log_dir} ({len(log_files)} 个文件)")

    all_records = []
    total_lines = 0
    total_errors = 0

    for filename in log_files:
        filepath = os.path.join(log_dir, filename)
        records, lines, errors = parse_log_file(filepath)
        all_records.extend(records)
        total_lines += lines
        total_errors += errors
        print(f"  {filename}: {len(records):,} 条解析, {errors} 条失败")

    print()
    print(f"合共 {len(all_records):,} 条数据，开始聚合入库...")
    print()

    aggregate_and_store(all_records, args.db, args.db_type)

    print(f"\n[OK] 完成! 总行数: {total_lines:,}, 成功: {len(all_records):,}, "
          f"失败: {total_errors:,}")
    if args.db_type == "mysql":
        print(f"   数据已写入 MySQL: {os.getenv('MYSQL_DATABASE', 'log_analytics')}")
    else:
        print(f"   数据已写入: {args.db}")


if __name__ == "__main__":
    main()
