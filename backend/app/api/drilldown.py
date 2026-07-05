"""交互式多维下钻查询 API (Feature 11)"""
from fastapi import APIRouter, Query
from app.services import drilldown_svc

router = APIRouter()


@router.get("/query")
async def drilldown_query(
    days: int = Query(7, ge=1, le=90, description="查询天数"),
    url_path: str = Query("", description="页面路径筛选（模糊匹配）"),
    terminal: str = Query("", description="终端类型筛选：PC/Mobile/Tablet"),
    browser: str = Query("", description="浏览器筛选：Chrome/Firefox/Safari/Edge"),
    status_code: int = Query(0, description="HTTP 状态码筛选（0=不限）"),
    keyword: str = Query("", description="搜索关键词筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=5, le=100, description="每页条数"),
    sort_by: str = Query("dt", description="排序字段"),
    sort_order: str = Query("desc", description="排序方向：asc/desc"),
):
    """多维度交互式下钻查询"""
    return drilldown_svc.drilldown_query(
        days=days,
        url_path=url_path,
        terminal=terminal,
        browser=browser,
        status_code=status_code,
        keyword=keyword,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )
