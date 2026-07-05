"""健康检查"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "日志分析平台",
        "timestamp": datetime.now().isoformat(),
    }
