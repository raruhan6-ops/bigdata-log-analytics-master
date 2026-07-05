#!/usr/bin/env python3
"""
Hive → MySQL ETL 脚本
从 Hive 聚合表读取数据，写入 MySQL 前端展示表

用法: python scripts/hive_to_mysql.py
前提: docker-compose up -d
"""
import subprocess
import sys
import os
import re
from datetime import date

# ---------- 配置 ----------
MYSQL_HOST = "localhost"
MYSQL_PORT = 3307
MYSQL_USER = "loguser"
MYSQL_PASS = "logpass123"
MYSQL_DB = "log_analytics"

HIVE_JDBC = "jdbc:hive2://localhost:10000"


def beeline(query: str) -> list[list[str]]:
    """执行 Hive 查询并返回解析后的结果"""
    # 设置 MSYS_NO_PATHCONV 防止 Git Bash 路径转换
    env = os.environ.copy()
    env["MSYS_NO_PATHCONV"] = "1"

    result = subprocess.run(
        [
            "docker", "exec", "-i", "log_hive_server2",
            "beeline", "-u", HIVE_JDBC,
            "--silent=true", "--showHeader=false",
            "--outputformat=csv2", "-e", query,
        ],
        capture_output=True, text=True, timeout=120, env=env,
    )

    rows = []
    for line in result.stdout.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("INFO") or line.startswith("SLF4J") or line.startswith("WARNING"):
            continue
        # csv2 格式: val1,val2,val3
        rows.append([col.strip() for col in line.split(",")])

    return rows


def mysql(sql: str):
    """执行 MySQL 语句"""
    env = os.environ.copy()
    env["MYSQL_PWD"] = MYSQL_PASS

    subprocess.run(
        [
            "docker", "exec", "-i", "log_mysql",
            "mysql", "-u", MYSQL_USER, MYSQL_DB,
            "-e", sql,
        ],
        capture_output=True, text=True, timeout=30, env=env,
    )


def mysql_insert(table: str, columns: list[str], rows: list[list]):
    """批量插入数据到 MySQL"""
    if not rows:
        print(f"  [SKIP] {table}: 无数据")
        return

    cols = ", ".join(columns)
    values_list = []
    for row in rows:
        vals = []
        for v in row:
            if v is None or v == "NULL" or v == "":
                vals.append("NULL")
            else:
                # 转义单引号
                vals.append(f"'{str(v).replace(chr(39), chr(39)+chr(39))}'")
        values_list.append(f"({', '.join(vals)})")

    values_str = ",\n".join(values_list)
    # 使用 REPLACE INTO 避免重复键冲突
    sql = f"REPLACE INTO {table} ({cols}) VALUES\n{values_str};"
    mysql(sql)
    print(f"  [OK] {table}: {len(rows)} 行")


def main():
    today = date.today().isoformat()

    print("=" * 50)
    print("  Hive → MySQL ETL")
    print("=" * 50)

    # ---- 1. KPI 日指标 ----
    print("\n[1/5] 导入 KPI 日指标 ...")
    rows = beeline(f"""
        SELECT dt, pv, uv, ip_count, sessions, avg_depth, bounce_rate
        FROM log_dw.ads_kpi_daily
    """)
    mysql_insert("kpi_daily",
                 ["dt", "pv", "uv", "ip_count", "sessions", "avg_depth", "bounce_rate"],
                 rows)

    # ---- 2. KPI 小时指标 ----
    print("\n[2/5] 导入 KPI 小时指标 ...")
    rows = beeline(f"""
        SELECT dt_hour, pv, uv, ip_count
        FROM log_dw.dws_pv_uv_hourly
        WHERE dt = '{today}'
    """)
    # dt_hour 格式: "2026-06-26 00" → dt=2026-06-26, hour=0
    parsed = []
    for r in rows:
        if len(r) >= 4:
            dt_hour = r[0]
            parts = dt_hour.split(" ")
            if len(parts) == 2:
                parsed.append([parts[0], parts[1], r[1], r[2], r[3]])
    mysql_insert("kpi_hourly", ["dt", "hour", "pv", "uv", "ip_count"], parsed)

    # ---- 3. 热门页面 ----
    print("\n[3/5] 导入热门页面排行 ...")
    rows = beeline(f"""
        SELECT url_path, page_name, pv, uv, rank_pos
        FROM log_dw.dws_page_rank_daily
        WHERE dt = '{today}'
        ORDER BY rank_pos
        LIMIT 20
    """)
    parsed = []
    for r in rows:
        if len(r) >= 5:
            parsed.append([today, r[0], r[1] if r[1] else "", r[2], r[3], r[4]])
    mysql_insert("top_pages", ["dt", "page_url", "page_name", "pv", "uv", "rank_pos"], parsed)

    # ---- 4. 终端分布 ----
    print("\n[4/5] 导入终端分布 ...")
    rows = beeline(f"""
        SELECT term_type, pv
        FROM log_dw.dws_terminal_dist
        WHERE dt = '{today}'
    """)
    parsed = []
    for r in rows:
        if len(r) >= 2:
            parsed.append([today, r[0], r[1]])
    mysql_insert("terminal_dist", ["dt", "term_type", "pv"], parsed)

    # ---- 5. 浏览器分布 ----
    print("\n[5/5] 导入浏览器分布 ...")
    rows = beeline(f"""
        SELECT browser, pv
        FROM log_dw.dws_browser_dist
        WHERE dt = '{today}'
    """)
    parsed = []
    for r in rows:
        if len(r) >= 2:
            parsed.append([today, r[0], r[1]])
    mysql_insert("browser_dist", ["dt", "browser", "pv"], parsed)

    print(f"\n{'=' * 50}")
    print("  ✅ ETL 完成！前端现在应该有数据了")
    print(f"  前端: http://localhost:5173")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
