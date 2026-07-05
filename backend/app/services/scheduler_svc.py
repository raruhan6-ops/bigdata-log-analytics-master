"""调度任务管理服务 (Feature 5)

模拟 DolphinScheduler 接口，返回数仓 ETL 流水线各节点的运行状态。
"""
from datetime import datetime, timedelta
import random

# 预定义 6 个核心调度任务
_JOBS = [
    {
        "job_id": "job_ods_dwd",
        "name": "ODS → DWD 日志清洗",
        "engine": "Spark SQL",
        "cron": "0 2 * * *",
        "description": "解析原始日志，清洗脏数据，生成明细宽表 dwd_page_view",
        "dag_layer": "ETL",
        "priority": "HIGH",
    },
    {
        "job_id": "job_session",
        "name": "DWD 会话还原 (Sessionization)",
        "engine": "Spark SQL",
        "cron": "0 2 30 * * *",
        "description": "基于 30 分钟间隔切分会话，计算 entry/exit page",
        "dag_layer": "ETL",
        "priority": "HIGH",
    },
    {
        "job_id": "job_dwd_dws",
        "name": "DWD → DWS 轻度汇总",
        "engine": "Hive",
        "cron": "0 3 * * *",
        "description": "小时级 PV/UV 汇总、页面排行、终端分布等 DWS 层聚合",
        "dag_layer": "ETL",
        "priority": "MEDIUM",
    },
    {
        "job_id": "job_dws_ads",
        "name": "DWS → ADS 指标宽表",
        "engine": "Hive",
        "cron": "0 4 * * *",
        "description": "计算日级 KPI 宽表、跳出率、留存率等应用层指标",
        "dag_layer": "ETL",
        "priority": "MEDIUM",
    },
    {
        "job_id": "job_ads_mysql",
        "name": "ADS → MySQL 同步",
        "engine": "Python Script",
        "cron": "0 5 * * *",
        "description": "将 Hive ADS 层数据同步到 MySQL 供 FastAPI 后端查询",
        "dag_layer": "Sync",
        "priority": "MEDIUM",
    },
    {
        "job_id": "job_flume_check",
        "name": "Flume 采集健康检查",
        "engine": "Shell",
        "cron": "*/10 * * * *",
        "description": "每 10 分钟检查 Flume Agent 是否存活，Kafka Topic 是否有新消息",
        "dag_layer": "Monitor",
        "priority": "LOW",
    },
]


def _random_status():
    r = random.random()
    if r < 0.75:
        return "SUCCESS"
    elif r < 0.90:
        return "RUNNING"
    elif r < 0.97:
        return "WAITING"
    else:
        return "FAILED"


def _generate_run_history(job_id: str, count: int = 5):
    """生成模拟执行历史"""
    history = []
    base = datetime.now()
    for i in range(count):
        run_time = base - timedelta(days=i, hours=random.randint(0, 3))
        status = "SUCCESS" if i > 0 else _random_status()
        duration = random.randint(30, 600)
        history.append({
            "run_id": f"{job_id}_run_{i+1}",
            "start_time": run_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": (run_time + timedelta(seconds=duration)).strftime("%Y-%m-%d %H:%M:%S"),
            "duration_sec": duration,
            "status": status,
            "records_processed": random.randint(5000, 200000) if status == "SUCCESS" else 0,
        })
    return history


def get_all_jobs() -> list[dict]:
    """返回所有调度任务及最新状态"""
    result = []
    for job in _JOBS:
        history = _generate_run_history(job["job_id"], 1)
        latest = history[0] if history else {}
        result.append({
            **job,
            "latest_status": latest.get("status", "UNKNOWN"),
            "latest_run_time": latest.get("start_time", ""),
            "latest_duration_sec": latest.get("duration_sec", 0),
        })
    return result


def get_job_logs(job_id: str) -> dict:
    """返回指定任务的执行历史"""
    job = next((j for j in _JOBS if j["job_id"] == job_id), None)
    if not job:
        return {"error": "Job not found", "runs": []}

    return {
        "job_id": job_id,
        "name": job["name"],
        "runs": _generate_run_history(job_id, 7),
    }
