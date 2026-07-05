"""
=============================================================================
日志生成器 — 仿真 Nginx Combined Log Format 访问日志

用法:
    python scripts/log_generator.py --days 7 --per-day 50000
    python scripts/log_generator.py --days 1 --per-day 1000 --output ./data/logs

输出格式:
    $remote_addr - $remote_user [$time_local] "$request" $status \
    $body_bytes_sent "$http_referer" "$http_user_agent"
=============================================================================
"""
import argparse
import os
import random
import sys
from datetime import datetime, timedelta

# ---------- 常量配置 ----------

# 中国各省级 IP 段（简化版，覆盖主要省份）
IP_POOL = [
    # 格式: (起始IP第三段范围, 省份, 城市)
    (range(1, 50), "北京", "北京"),
    (range(50, 100), "上海", "上海"),
    (range(100, 150), "广东", "广州"),
    (range(150, 200), "广东", "深圳"),
    (range(200, 220), "浙江", "杭州"),
    (range(220, 240), "江苏", "南京"),
    (range(240, 255), "四川", "成都"),
]

# 页面路径池，模拟真实网站结构
PAGE_POOL = [
    # (路径, 页面名称, 权重) — 权重越大出现概率越高
    ("/", "首页", 100),
    ("/products", "产品列表", 60),
    ("/products/detail", "产品详情", 50),
    ("/news", "新闻中心", 40),
    ("/news/tech", "科技新闻", 30),
    ("/news/company", "公司新闻", 20),
    ("/about", "关于我们", 15),
    ("/contact", "联系我们", 10),
    ("/api/user/login", "用户登录", 30),
    ("/api/user/register", "用户注册", 15),
    ("/api/products/list", "产品接口", 25),
    ("/api/orders/create", "订单接口", 20),
    ("/search", "搜索页", 35),
    ("/help", "帮助中心", 12),
    ("/download", "下载中心", 18),
    ("/blog", "博客", 22),
    ("/blog/article", "博客文章", 20),
    ("/faq", "常见问题", 10),
    ("/terms", "服务条款", 5),
    ("/privacy", "隐私政策", 5),
]

# HTTP 状态码及其权重
STATUS_CODES = [
    (200, 80),
    (304, 5),
    (301, 2),
    (302, 3),
    (400, 2),
    (403, 2),
    (404, 4),
    (500, 2),
]

# Referer 来源
REFERERS = [
    ("https://www.baidu.com/s?wd={keyword}", 35),
    ("https://www.google.com/search?q={keyword}", 15),
    ("-", 30),  # 直接访问
    ("https://{internal_page}", 20),  # 站内跳转
]

# 搜索关键词
KEYWORDS = [
    "日志分析", "大数据平台", "数据分析工具", "Python教程",
    "Spring Boot", "Vue3", "Hadoop安装", "Spark调优",
    "Kafka入门", "Hive SQL", "数据仓库", "用户画像",
    "产品价格", "公司地址", "招聘信息", "技术博客",
]

# User-Agent 池
USER_AGENTS = {
    "PC": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver} Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver} Edge/{ver}",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver} Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{ver_ff}) Gecko/20100101 Firefox/{ver_ff}",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    ],
    "Mobile": [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver} Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 13; SM-S9080) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver} Mobile Safari/537.36",
    ],
    "Tablet": [
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver} Safari/537.36",
    ],
}

# 浏览器版本范围
CHROME_VERSIONS = ["120.0.6099", "121.0.6167", "122.0.6261", "123.0.6312"]
FIREFOX_VERSIONS = ["121.0", "122.0", "123.0", "124.0"]


def weighted_choice(items):
    """加权随机选择 — 每个元素都是 (item, weight) 二元组，weight 固定为最后一个"""
    total = sum(item[-1] for item in items)
    r = random.randint(1, total)
    acc = 0
    for item in items:
        acc += item[-1]
        if r <= acc:
            return item
    return items[0]


def gen_ip():
    """生成随机中国 IP"""
    first = random.choice(["182", "221", "61", "118", "123", "124", "125", "222", "223", "36"])
    second = random.randint(0, 255)
    third_range, province, city = random.choice(IP_POOL)
    third = random.choice(third_range)
    fourth = random.randint(1, 254)
    ip = f"{first}.{second}.{third}.{fourth}"
    return ip, province, city


def gen_timestamp(base_date, hour_dist):
    """
    按小时分布生成时间戳。
    hour_dist: list[int]，24 个元素代表每小时权重。
    默认模拟真实流量：凌晨低、上午爬升、下午高峰、晚上回落。
    """
    hour = weighted_choice([(h, hour_dist[h]) for h in range(24)])[0]
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    ts = base_date.replace(hour=hour, minute=minute, second=second)
    return ts.strftime("%d/%b/%Y:%H:%M:%S +0800")


def gen_request():
    """生成 HTTP 请求行"""
    page_path, page_name, _ = weighted_choice(PAGE_POOL)
    method = weighted_choice([("GET", 80), ("POST", 15), ("HEAD", 3), ("PUT", 2)])[0]

    # 为详情页和 API 随机添加参数
    if "/detail" in page_path or "/article" in page_path:
        page_path = f"{page_path}?id={random.randint(1, 9999)}"
    elif page_path.startswith("/api/"):
        page_path = f"{page_path}?t={random.randint(10000, 99999)}"
    elif page_path == "/search":
        kw = random.choice(KEYWORDS)
        page_path = f"{page_path}?q={kw}"

    return f"{method} {page_path} HTTP/1.1"


def gen_referer():
    """生成 Referer 头"""
    ref, _ = weighted_choice(REFERERS)
    if "{keyword}" in ref:
        ref = ref.replace("{keyword}", random.choice(KEYWORDS))
    if "{internal_page}" in ref:
        internal, _, _ = weighted_choice(PAGE_POOL)
        ref = f"https://www.example.com{internal}"
    return ref


def gen_user_agent():
    """生成 User-Agent 头，返回 (ua_string, terminal_type, browser_name)"""
    term = weighted_choice([("PC", 65), ("Mobile", 30), ("Tablet", 5)])[0]
    ua_template = random.choice(USER_AGENTS[term])

    if "{ver}" in ua_template:
        ua_template = ua_template.replace("{ver}", random.choice(CHROME_VERSIONS))
    if "{ver_ff}" in ua_template:
        ua_template = ua_template.replace("{ver_ff}", random.choice(FIREFOX_VERSIONS))

    # 解析浏览器名
    if "Chrome" in ua_template and "Edge" in ua_template:
        browser = "Edge"
    elif "Chrome" in ua_template:
        browser = "Chrome"
    elif "Firefox" in ua_template:
        browser = "Firefox"
    elif "Safari" in ua_template and "Chrome" not in ua_template:
        browser = "Safari"
    else:
        browser = "Other"

    return ua_template, term, browser


def gen_log_line(base_date, hour_dist, log_format="combined", ip_info=None):
    """生成单条日志（支持 Combined 和 Common 两种格式，增加 session_id）

    Combined (Nginx 默认):
        $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$session_id"

    Common (Apache 老格式，少了 Referer 和 User-Agent):
        $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent
    """
    # 70% 概率复用 IP 池（模拟回头客），30% 新 IP
    session_id = "-"
    if ip_info and random.random() < 0.70:
        ip, session_id = ip_info
        province, city = "广东", "广州"  # 简化：复用 IP 不重新查省份
    else:
        ip, province, city = gen_ip()
        import uuid
        session_id = str(uuid.uuid4())[:8]
    timestamp = gen_timestamp(base_date, hour_dist)
    request = gen_request()
    status, _ = weighted_choice(STATUS_CODES)
    body_bytes = random.choice([
        random.randint(100, 500),
        random.randint(500, 2000),
        random.randint(2000, 10000),
        random.randint(10000, 50000),
        random.randint(50000, 200000),
    ])

    if log_format == "common":
        # Common Log Format: 7 个字段，无 Referer 和 User-Agent
        log_line = (
            f'{ip} - - [{timestamp}] "{request}" {status} {body_bytes}'
        )
        meta = {
            "ip": ip, "province": province, "city": city,
            "terminal": "Unknown", "browser": "Unknown", "status": status,
        }
    else:
        # Combined Log Format: 10 个字段 (加了 session_id)
        referer = gen_referer()
        ua_string, term, browser = gen_user_agent()
        log_line = (
            f'{ip} - - [{timestamp}] "{request}" {status} {body_bytes} '
            f'"{referer}" "{ua_string}" "{session_id}"'
        )
        meta = {
            "ip": ip, "province": province, "city": city,
            "terminal": term, "browser": browser, "status": status,
            "session_id": session_id
        }

    return log_line, meta


def generate_logs(days, per_day, output_dir, show_progress=True, log_format="combined"):
    """
    主函数：生成仿真日志。

    Parameters:
        days: 生成天数
        per_day: 每天日志条数（基准值，实际有日期波动）
        output_dir: 输出目录
        show_progress: 是否显示进度条
        log_format: 'combined' (默认) 或 'common'

    Returns:
        生成的文件路径列表
    """
    os.makedirs(output_dir, exist_ok=True)
    files_created = []

    # 24 小时流量分布：模拟真实网络访问规律
    hour_dist = [
        1, 1, 1, 1, 2,  # 0-4: 低谷
        4, 10, 20, 30, 35,  # 5-9: 早高峰
        50, 60, 55, 55, 60,  # 10-14: 白天高峰
        65, 70, 75, 80, 85,  # 15-19: 晚高峰
        40, 25, 10, 5,  # 20-23: 回落
    ]

    end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for day_offset in range(days, 0, -1):
        base_date = end_date - timedelta(days=day_offset)
        date_str = base_date.strftime("%Y-%m-%d")
        filename = f"access.{date_str}.log"
        filepath = os.path.join(output_dir, filename)

        # ---- 日期波动：周末流量低于工作日 ----
        dow = base_date.weekday()  # 0=周一, 6=周日
        if dow >= 5:
            day_factor = random.uniform(0.55, 0.75)  # 周末 55%~75%
        elif dow == 0:
            day_factor = random.uniform(0.95, 1.15)  # 周一反弹
        elif dow == 4:
            day_factor = random.uniform(0.85, 1.05)  # 周五略低
        else:
            day_factor = random.uniform(0.88, 1.12)  # 工作日正常波动
        today_count = max(100, int(per_day * day_factor))

        # ---- 模拟回头客：IP 池，70% 请求复用已有 IP ----
        ip_pool_size = max(50, today_count // 6)  # UV ≈ PV * 0.15~0.2
        ip_pool = []  # IP 列表，可出现多次（模拟高频用户）
    session_pool = [] # 伴随 IP 分配 session_id
    import uuid
    for _ in range(ip_pool_size):
        ip, _, _ = gen_ip()
        session_id = str(uuid.uuid4())[:8] # 简短的 session id
        # 部分 IP 被多次加入 = 高频访问用户
        repeat = 1
        r = random.random()
        if r < 0.05:
            repeat = random.randint(20, 80)
        elif r < 0.15:
            repeat = random.randint(5, 20)
        elif r < 0.35:
            repeat = random.randint(2, 5)
        ip_pool.extend([(ip, session_id)] * repeat)
    random.shuffle(ip_pool)

    with open(filepath, "w", encoding="utf-8") as f:
        for i in range(today_count):
            ip_info = ip_pool[i % len(ip_pool)]
            # 传递 ip_info 而不是整个 ip_pool 和 index
            log_line, _ = gen_log_line(base_date, hour_dist, log_format, ip_info)
            f.write(log_line + "\n")
            if show_progress and (i + 1) % max(1, today_count // 10) == 0:
                pct = (i + 1) * 100 // today_count
                bar = "#" * (pct // 2) + "." * (50 - pct // 2)
                print(f"\r  [{date_str}] [{bar}] {pct:3d}%", end="", flush=True)
            print()  # 换行

        # 计算文件大小
        file_size = os.path.getsize(filepath)
        files_created.append((filepath, file_size))

    return files_created


def main():
    parser = argparse.ArgumentParser(
        description="生成仿真 Nginx Combined Log Format 访问日志"
    )
    parser.add_argument(
        "--days", type=int, default=7,
        help="生成天数（默认：7）"
    )
    parser.add_argument(
        "--per-day", type=int, default=50000,
        help="每天日志条数（默认：50000）"
    )
    parser.add_argument(
        "--output", type=str, default="./data/logs",
        help="输出目录（默认：./data/logs）"
    )
    parser.add_argument(
        "--format", type=str, default="combined", choices=["combined", "common"],
        help="日志格式：combined (Nginx 默认, 含 Referer/UA) | common (Apache 老格式)（默认：combined）"
    )
    parser.add_argument(
        "--quiet", action="store_true",
        help="静默模式，不显示进度"
    )
    args = parser.parse_args()

    total = args.days * args.per_day
    print(f"日志生成器启动")
    print(f"  格式: {args.format}  天数: {args.days}  日量: {args.per_day:,} 条  总计: {total:,} 条")
    print(f"  输出: {args.output}")
    print()

    files = generate_logs(args.days, args.per_day, args.output,
                          show_progress=not args.quiet, log_format=args.format)

    total_size = sum(s for _, s in files)
    print(f"\n[OK] 完成! 生成 {len(files)} 个文件，总大小 {total_size / 1024 / 1024:.1f} MB")
    for path, size in files:
        print(f"  >> {path}  ({size / 1024:.0f} KB)")

    print(f"\n提示：运行 'docker-compose up -d' 启动 Kafka + MySQL，")
    print(f"然后可通过 Flume 将这些日志导入 Kafka → HDFS → Hive 进行分析。")


if __name__ == "__main__":
    main()
