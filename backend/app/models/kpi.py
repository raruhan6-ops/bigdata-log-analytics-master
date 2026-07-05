"""Pydantic 数据模型"""
from typing import Optional
from pydantic import BaseModel


class KpiOverview(BaseModel):
    """KPI 总览"""
    pv: int = 0
    uv: int = 0
    ip_count: int = 0
    sessions: int = 0
    avg_session_duration: float = 0.0 # 平均会话时长(秒)
    avg_depth: float = 0.0
    bounce_rate: float = 0.0
    pv_change: float = 0.0   # 环比变化（%）
    uv_change: float = 0.0


class TrendPoint(BaseModel):
    """趋势数据点"""
    label: str       # 时间标签（小时: 00:00 / 日期: 07-01）
    pv: int
    uv: int


class TrendResponse(BaseModel):
    """趋势响应"""
    pv_series: list[TrendPoint] = []
    uv_series: list[TrendPoint] = []


class TopPage(BaseModel):
    """热门页面"""
    rank: int
    url: str
    name: str
    pv: int
    uv: int


class Distribution(BaseModel):
    """分布数据"""
    name: str
    value: int


class DistributionResponse(BaseModel):
    """分布响应"""
    items: list[Distribution] = []

class TopKeyword(BaseModel):
    """热门搜索词"""
    rank: int
    keyword: str
    search_count: int

class PageBounce(BaseModel):
    """页面跳出率"""
    url: str
    entry_count: int
    bounce_count: int
    bounce_rate: float

class RetentionData(BaseModel):
    """留存率数据"""
    date: str
    new_users: int
    retention_1d: float
    retention_3d: float
    retention_7d: float
