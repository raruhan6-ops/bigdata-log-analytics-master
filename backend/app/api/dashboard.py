"""KPI 大盘 API"""
from fastapi import APIRouter, Query
from app.services import dashboard_svc
from app.models.kpi import KpiOverview, TrendResponse

router = APIRouter()


@router.get("/overview", response_model=KpiOverview)
async def overview():
    """获取今日 KPI 总览"""
    return dashboard_svc.get_overview()


@router.get("/trend", response_model=TrendResponse)
async def trend(
    days: int = Query(7, ge=1, le=365, description="查询天数"),
    granularity: str = Query("day", description="粒度：hour/day"),
):
    """获取 PV/UV 趋势数据"""
    return dashboard_svc.get_trend(days=days, granularity=granularity)
