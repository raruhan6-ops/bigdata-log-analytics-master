"""数据库连接（SQLite / MySQL）"""
from sqlalchemy import create_engine, text
from app.config import settings

_connect_args = {}
if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    echo=False,
)


def query(sql: str, params=None):
    """执行查询并返回 dict 列表"""
    with engine.connect() as conn:
        rows = conn.execute(text(sql), params or {})
        return [dict(row._mapping) for row in rows]
