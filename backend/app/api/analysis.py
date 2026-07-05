"""数据分析 API"""
from fastapi import APIRouter, Query
from app.services import analysis_svc
from app.models.kpi import TopPage, DistributionResponse, TopKeyword, PageBounce, RetentionData

router = APIRouter()


@router.get("/top-pages", response_model=list[TopPage])
async def top_pages(
    limit: int = Query(20, ge=5, le=100, description="返回条数"),
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取热门页面 TOP N"""
    return analysis_svc.get_top_pages(limit=limit, days=days)


@router.get("/distribution/terminal", response_model=DistributionResponse)
async def terminal_dist(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取终端类型分布"""
    return analysis_svc.get_terminal_dist(days=days)


@router.get("/distribution/browser", response_model=DistributionResponse)
async def browser_dist(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取浏览器分布"""
    return analysis_svc.get_browser_dist(days=days)

@router.get("/top-keywords", response_model=list[TopKeyword])
async def top_keywords(
    limit: int = Query(10, ge=5, le=50, description="返回条数"),
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取热门搜索词排行 (Feature 8)"""
    return analysis_svc.get_top_keywords(limit=limit, days=days)

@router.get("/bounce-rates", response_model=list[PageBounce])
async def bounce_rates(
    limit: int = Query(10, ge=5, le=50, description="返回条数"),
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取页面跳出与流失排行 (Feature 9)"""
    return analysis_svc.get_page_bounce_rates(limit=limit, days=days)

@router.get("/retention", response_model=list[RetentionData])
async def retention_data(
    days: int = Query(14, ge=7, le=90, description="统计天数"),
):
    """获取留存率分析图表数据 (Feature 7)"""
    return analysis_svc.get_retention_data(days=days)


@router.get("/distribution/os", response_model=DistributionResponse)
async def os_dist(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取操作系统分布 (Feature 10)"""
    return analysis_svc.get_os_dist(days=days)


@router.get("/session-distribution")
async def session_distribution(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
):
    """获取会话时长分布 (Feature 7)"""
    return analysis_svc.get_session_distribution(days=days)
