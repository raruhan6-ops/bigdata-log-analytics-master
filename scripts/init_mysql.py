"""
=============================================================================
MySQL 初始化脚本 — 创建数据库和用户（一次性操作）

用法:
    python scripts/init_mysql.py --root-password 123456
    python scripts/init_mysql.py --root-password 123456 --db-name summer_logs

说明:
    - 仅在换新 MySQL 环境时手动执行一次
    - root 密码通过命令行传入，不写入文件
    - 库名/端口/用户名默认读 .env，也可命令行覆盖
=============================================================================
"""
import argparse
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import pymysql
except ImportError:
    print("[ERROR] 需要安装 pymysql: pip install pymysql")
    sys.exit(1)

# ==================== 配置区（按需修改） ====================
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "log_analytics")
MYSQL_USER = os.getenv("MYSQL_USER", "loguser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "logpass123")
# ==========================================================


def main():
    parser = argparse.ArgumentParser(description="初始化 MySQL 数据库和用户")
    parser.add_argument("--root-password", required=True, help="MySQL root 密码")
    parser.add_argument("--root-user", default="root", help="MySQL root 用户名（默认 root）")
    parser.add_argument("--host", default=MYSQL_HOST, help=f"MySQL 地址（默认 {MYSQL_HOST}）")
    parser.add_argument("--port", type=int, default=MYSQL_PORT, help=f"MySQL 端口（默认 {MYSQL_PORT}）")
    parser.add_argument("--db-name", default=MYSQL_DATABASE, help=f"要创建的数据库名（默认 {MYSQL_DATABASE}）")
    parser.add_argument("--app-user", default=MYSQL_USER, help=f"应用用户名（默认 {MYSQL_USER}）")
    parser.add_argument("--app-password", default=MYSQL_PASSWORD, help="应用用户密码")
    args = parser.parse_args()

    print(f"MySQL 初始化")
    print(f"  服务器: {args.host}:{args.port}")
    print(f"  数据库: {args.db_name}")
    print(f"  应用用户: {args.app_user}")
    print()

    try:
        conn = pymysql.connect(
            host=args.host, port=args.port,
            user=args.root_user, password=args.root_password,
            charset="utf8mb4",
        )
        cursor = conn.cursor()
    except pymysql.err.OperationalError as e:
        print(f"[ERROR] 连接 MySQL 失败: {e}")
        print(f"  请确认 MySQL 已启动且 root 密码正确")
        sys.exit(1)

    try:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{args.db_name}` "
            f"DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        print(f"  [OK] 数据库 {args.db_name} 已就绪")
    except pymysql.err.ProgrammingError as e:
        print(f"  [WARN] 建库失败: {e}")

    try:
        cursor.execute(
            f"CREATE USER IF NOT EXISTS '{args.app_user}'@'%' "
            f"IDENTIFIED BY '{args.app_password}'"
        )
        cursor.execute(
            f"CREATE USER IF NOT EXISTS '{args.app_user}'@'localhost' "
            f"IDENTIFIED BY '{args.app_password}'"
        )
        print(f"  [OK] 用户 {args.app_user} 已就绪")
    except pymysql.err.ProgrammingError as e:
        print(f"  [WARN] 建用户失败（可能已存在）: {e}")

    try:
        cursor.execute(
            f"GRANT ALL PRIVILEGES ON `{args.db_name}`.* "
            f"TO '{args.app_user}'@'%'"
        )
        cursor.execute(
            f"GRANT ALL PRIVILEGES ON `{args.db_name}`.* "
            f"TO '{args.app_user}'@'localhost'"
        )
        cursor.execute("FLUSH PRIVILEGES")
        print(f"  [OK] 权限已授予")
    except pymysql.err.ProgrammingError as e:
        print(f"  [WARN] 授权失败: {e}")

    conn.commit()
    conn.close()

    # 验证：用应用用户连接
    try:
        conn = pymysql.connect(
            host=args.host, port=args.port,
            user=args.app_user, password=args.app_password,
            database=args.db_name, charset="utf8mb4",
        )
        conn.close()
        print(f"\n[OK] 初始化完成！应用用户 {args.app_user} 可正常连接 {args.db_name}")
    except pymysql.err.OperationalError as e:
        print(f"\n[ERROR] 应用用户连接验证失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
