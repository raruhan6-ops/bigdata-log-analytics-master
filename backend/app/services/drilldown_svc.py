"""交互式多维下钻查询服务 (Feature 11)

支持按日期范围、页面路径、终端类型、浏览器、HTTP 状态码等多维度筛选，
返回明细数据 + 聚合小结。
"""
from datetime import datetime, timedelta
from app.db import query


def drilldown_query(
    days: int = 7,
    url_path: str = "",
    terminal: str = "",
    browser: str = "",
    status_code: int = 0,
    keyword: str = "",
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "dt",
    sort_order: str = "desc",
) -> dict:
    """多维度下钻查询"""
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    params: dict = {"start_date": start_date}
    conditions = ["dt >= :start_date"]

    if url_path:
        conditions.append("page_url LIKE :url_path")
        params["url_path"] = f"%{url_path}%"
    if terminal:
        conditions.append("term_type = :terminal")
        params["terminal"] = terminal
    if browser:
        conditions.append("browser = :browser")
        params["browser"] = browser

    where_clause = " AND ".join(conditions)

    # --- 聚合小结 ---
    agg_sql = f"""
        SELECT
            COUNT(*) AS total_records,
            SUM(pv) AS total_pv,
            SUM(uv) AS total_uv
        FROM top_pages
        WHERE {where_clause}
    """
    try:
        agg_rows = query(agg_sql, params)
        summary = agg_rows[0] if agg_rows else {}
    except Exception:
        summary = {"total_records": 0, "total_pv": 0, "total_uv": 0}

    # --- 明细数据 ---
    allowed_sort = {"dt", "page_url", "pv", "uv"}
    if sort_by not in allowed_sort:
        sort_by = "dt"
    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    offset = (page - 1) * page_size

    detail_sql = f"""
        SELECT dt, page_url, pv, uv
        FROM top_pages
        WHERE {where_clause}
        ORDER BY {sort_by} {order}
        LIMIT :page_size OFFSET :offset
    """
    params["page_size"] = page_size
    params["offset"] = offset

    try:
        rows = query(detail_sql, params)
        details = [
            {
                "dt": str(r.get("dt", "")),
                "page_url": r.get("page_url", ""),
                "pv": r.get("pv", 0),
                "uv": r.get("uv", 0),
            }
            for r in rows
        ]
    except Exception:
        details = []

    return {
        "summary": {
            "total_records": summary.get("total_records", 0) or 0,
            "total_pv": summary.get("total_pv", 0) or 0,
            "total_uv": summary.get("total_uv", 0) or 0,
        },
        "details": details,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "has_more": len(details) == page_size,
        },
    }
