"""调度任务管理 API (Feature 5)"""
from fastapi import APIRouter
from app.services import scheduler_svc

router = APIRouter()


@router.get("/jobs")
async def list_jobs():
    """获取所有调度任务及最新状态"""
    return scheduler_svc.get_all_jobs()


@router.get("/jobs/{job_id}/logs")
async def job_logs(job_id: str):
    """获取指定任务的执行历史"""
    return scheduler_svc.get_job_logs(job_id)
