#!/bin/bash
echo "========================================"
echo "  日志分析平台 — 一键启动"
echo "========================================"
echo ""

# 1. 虚拟环境 + 生成仿真日志
echo "[1/3] 初始化 Python 环境..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r backend/requirements.txt -q
python scripts/log_generator.py --days 7 --per-day 10000 || echo "⚠️ 日志生成失败或已存在，跳过"
echo ""

# 2. 后端
echo "[2/3] 启动后端（端口 8000）..."
cd backend
source ../.venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
cd ..
echo "✅ 后端: http://localhost:8000/docs"
echo ""

# 3. 前端
echo "[3/3] 启动前端（端口 5173）..."
cd frontend
[ ! -d "node_modules" ] && npm install
npm run dev &
cd ..
echo "✅ 前端: http://localhost:5173"
echo ""

echo "========================================"
echo "  🎉 启动完成！"
echo "========================================"
wait
