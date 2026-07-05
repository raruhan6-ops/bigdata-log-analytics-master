"""数据分析查询服务"""
from datetime import datetime, timedelta
from app.db import query
from app.models.kpi import TopPage, Distribution, DistributionResponse, TopKeyword, PageBounce, RetentionData


def get_top_pages(limit: int = 20, days: int = 7) -> list[TopPage]:
    """获取热门页面 TOP N"""
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    rows = query("""
        SELECT page_url, SUM(pv) AS total_pv, SUM(uv) AS total_uv
        FROM top_pages
        WHERE dt >= :start_date
        GROUP BY page_url
        ORDER BY total_pv DESC
        LIMIT :limit
    """, {"start_date": start_date, "limit": limit})

    result = []
    for rank, r in enumerate(rows, 1):
        result.append(TopPage(
            rank=rank,
            url=r["page_url"],
            name="",
            pv=r["total_pv"],
            uv=r.get("total_uv", 0),
        ))
    return result


def _start_date(days: int) -> str:
    return (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")


def get_terminal_dist(days: int = 7) -> DistributionResponse:
    """获取终端类型分布"""
    rows = query("""
        SELECT term_type, SUM(pv) AS total_pv
        FROM terminal_dist
        WHERE dt >= :start_date
        GROUP BY term_type
        ORDER BY total_pv DESC
    """, {"start_date": _start_date(days)})

    return DistributionResponse(items=[
        Distribution(name=r["term_type"], value=r["total_pv"])
        for r in rows
    ])


def get_browser_dist(days: int = 7) -> DistributionResponse:
    """获取浏览器分布"""
    rows = query("""
        SELECT browser, SUM(pv) AS total_pv
        FROM browser_dist
        WHERE dt >= :start_date
        GROUP BY browser
        ORDER BY total_pv DESC
    """, {"start_date": _start_date(days)})

    return DistributionResponse(items=[
        Distribution(name=r["browser"], value=r["total_pv"])
        for r in rows
    ])

def get_top_keywords(limit: int = 20, days: int = 7) -> list[TopKeyword]:
    """获取热门搜索词 TOP N (Feature 8)"""
    rows = query("""
        SELECT keyword, SUM(search_count) AS total_search
        FROM top_search_keywords
        WHERE dt >= :start_date
        GROUP BY keyword
        ORDER BY total_search DESC
        LIMIT :limit
    """, {"start_date": _start_date(days), "limit": limit})

    return [
        TopKeyword(rank=rank, keyword=r["keyword"], search_count=r["total_search"])
        for rank, r in enumerate(rows, 1)
    ]

def get_page_bounce_rates(limit: int = 20, days: int = 7) -> list[PageBounce]:
    """获取页面跳出率排行，找出流失最多的页面 (Feature 9)"""
    rows = query("""
        SELECT url_path, SUM(entry_count) AS total_entry, SUM(bounce_count) AS total_bounce,
               (SUM(bounce_count) * 100.0 / NULLIF(SUM(entry_count), 0)) AS avg_bounce_rate
        FROM page_bounce_rate
        WHERE dt >= :start_date
        GROUP BY url_path
        HAVING total_entry > 10 -- 过滤掉偶然访问
        ORDER BY avg_bounce_rate DESC, total_entry DESC
        LIMIT :limit
    """, {"start_date": _start_date(days), "limit": limit})

    return [
        PageBounce(
            url=r["url_path"], 
            entry_count=r["total_entry"], 
            bounce_count=r["total_bounce"],
            bounce_rate=round(float(r["avg_bounce_rate"] or 0), 2)
        )
        for r in rows
    ]

def get_retention_data(days: int = 14) -> list[RetentionData]:
    """获取用户留存数据趋势 (Feature 7)"""
    rows = query("""
        SELECT dt, new_users, retention_1d, retention_3d, retention_7d
        FROM user_retention
        WHERE dt >= :start_date
        ORDER BY dt ASC
    """, {"start_date": _start_date(days)})

    return [
        RetentionData(
            date=str(r["dt"]),
            new_users=r["new_users"],
            retention_1d=float(r["retention_1d"]),
            retention_3d=float(r["retention_3d"]),
            retention_7d=float(r["retention_7d"])
        )
        for r in rows
    ]


def get_os_dist(days: int = 7) -> DistributionResponse:
    """获取操作系统分布 (Feature 10)"""
    try:
        rows = query("""
            SELECT os_name, SUM(pv) AS total_pv
            FROM os_dist
            WHERE dt >= :start_date
            GROUP BY os_name
            ORDER BY total_pv DESC
        """, {"start_date": _start_date(days)})

        return DistributionResponse(items=[
            Distribution(name=r["os_name"], value=r["total_pv"])
            for r in rows
        ])
    except Exception:
        # 表不存在时返回空
        return DistributionResponse(items=[])


def get_session_distribution(days: int = 7) -> dict:
    """获取会话时长分布 (Feature 7)"""
    try:
        rows = query("""
            SELECT duration_bucket, session_count
            FROM session_duration_dist
            WHERE dt >= :start_date
            ORDER BY bucket_order ASC
        """, {"start_date": _start_date(days)})

        return {
            "buckets": [
                {"label": r["duration_bucket"], "count": r["session_count"]}
                for r in rows
            ]
        }
    except Exception:
        # 表不存在时返回空
        return {"buckets": []}

