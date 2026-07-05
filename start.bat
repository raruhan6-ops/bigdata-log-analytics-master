@echo off
title Log Analytics Platform

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ========================================
echo   Log Analytics Platform
echo ========================================
echo.

REM --- npm cache ---
echo   Setting npm cache to project dir ...
call npm config set cache "%ROOT%.npm-cache" 2>nul

REM --- Step 1: Python setup ---
echo [1/3] Python venv + dependencies ...

if not exist "%ROOT%.venv\Scripts\python.exe" (
    echo   Creating .venv ...
    python -m venv "%ROOT%.venv"
)

echo   Installing Python packages ...
call "%ROOT%.venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt" -q -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn

echo   Generating sample logs ...
call "%ROOT%.venv\Scripts\python.exe" "%ROOT%scripts\log_generator.py" --days 7 --per-day 10000 2>nul
if %ERRORLEVEL% neq 0 echo   (skipped or done)

echo   Parsing logs into MySQL ...
call "%ROOT%.venv\Scripts\python.exe" "%ROOT%scripts\parse_logs.py" --log-dir "%ROOT%data\logs" --db-type mysql 2>nul
if %ERRORLEVEL% neq 0 echo   (skipped or done)
echo.

REM --- Step 2: Backend ---
echo [2/3] Starting backend on port 8000 ...
cd /d "%ROOT%backend"
start "LogAPI" cmd /k "%ROOT%.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo   API docs: http://localhost:8000/docs
echo.

REM --- Step 3: Frontend ---
echo [3/3] Starting frontend on port 5173 ...
cd /d "%ROOT%frontend"
if not exist "%ROOT%frontend\node_modules" (
    echo   Installing npm packages ...
    call npm install --registry=https://registry.npmmirror.com
)
start "LogFrontend" npm run dev
echo   Dashboard: http://localhost:5173
echo.

cd /d "%ROOT%"
echo ========================================
echo   All done! Open http://localhost:5173
echo ========================================
pause
