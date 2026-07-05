"""KPI 大盘查询服务"""
from datetime import datetime, timedelta
from app.db import query
from app.models.kpi import KpiOverview, TrendPoint, TrendResponse


def get_overview() -> KpiOverview:
    """获取最新一天的 KPI 总览"""
    rows = query("""
        SELECT dt, pv, uv, ip_count
        FROM kpi_daily
        ORDER BY dt DESC
        LIMIT 2
    """)

    if not rows:
        return KpiOverview()

    today = rows[0]
    yesterday = rows[1] if len(rows) > 1 else None

    pv_change = 0.0
    uv_change = 0.0
    if yesterday and yesterday.get("pv", 0) > 0:
        pv_change = round(
            (today["pv"] - yesterday["pv"]) / yesterday["pv"] * 100, 1
        )
    if yesterday and yesterday.get("uv", 0) > 0:
        uv_change = round(
            (today["uv"] - yesterday["uv"]) / yesterday["uv"] * 100, 1
        )

    return KpiOverview(
        pv=today.get("pv", 0),
        uv=today.get("uv", 0),
        ip_count=today.get("ip_count", 0),
        sessions=today.get("uv", 0),  # 简化：UV ≈ 会话数
        avg_depth=0,
        bounce_rate=0,
        pv_change=pv_change,
        uv_change=uv_change,
    )


def get_trend(days: int = 7, granularity: str = "day") -> TrendResponse:
    """获取 PV/UV 趋势"""
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    rows = query("""
        SELECT dt, SUM(pv) AS pv, SUM(uv) AS uv
        FROM kpi_hourly
        WHERE dt >= :start_date
        GROUP BY dt
        ORDER BY dt
    """, {"start_date": start_date})

    pv_series = []
    uv_series = []
    for r in rows:
        dt_val = r["dt"]
        dt_str = dt_val.strftime("%Y-%m-%d") if hasattr(dt_val, 'strftime') else str(dt_val)
        label = dt_str[-5:] if dt_str else ""  # 截取 MM-DD
        pv_series.append(TrendPoint(label=label, pv=r["pv"], uv=r["uv"]))
        uv_series.append(TrendPoint(label=label, pv=r["pv"], uv=r["uv"]))

    return TrendResponse(pv_series=pv_series, uv_series=uv_series)
