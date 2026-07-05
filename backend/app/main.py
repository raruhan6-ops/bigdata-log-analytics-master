"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import health, dashboard, analysis, scheduler, drilldown

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
)

# CORS — 允许前端跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, tags=["健康检查"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["KPI 大盘"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["数据分析"])
app.include_router(scheduler.router, prefix="/api/scheduler", tags=["任务调度"])
app.include_router(drilldown.router, prefix="/api/drilldown", tags=["下钻查询"])


@app.get("/")
async def root():
    return {"message": settings.APP_TITLE, "version": settings.APP_VERSION}
