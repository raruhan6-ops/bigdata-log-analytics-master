# =============================================================================
# FastAPI 后端 Docker 镜像
# =============================================================================
FROM python:3.12-slim

WORKDIR /app

# 安装系统依赖（pymysql 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    --trusted-host pypi.tuna.tsinghua.edu.cn

# 复制后端代码
COPY backend/ .

# 复制数据仓库 SQL（供 ETL 参考）
COPY data-warehouse/ data-warehouse/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
