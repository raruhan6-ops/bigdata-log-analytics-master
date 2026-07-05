@echo off
title Log Analytics Pipeline
setlocal enabledelayedexpansion

echo ========================================
echo   1. Container Status
echo ========================================
docker ps --filter name=log_ --format "table {{.Names}}\t{{.Status}}"
echo.

echo ========================================
echo   2. Generate Logs
echo ========================================
python scripts\log_generator.py --days 3 --per-day 5000 --output .\data\logs
if errorlevel 1 echo [WARN] Log generation skipped
echo [OK] Logs ready
echo.

echo ========================================
echo   3. HDFS Status
echo ========================================
docker exec log_namenode hdfs dfsadmin -report 2>nul | findstr "Live"
docker exec log_namenode hdfs dfs -mkdir -p /data/log_dw/ods/access_log 2>nul
docker exec log_namenode hdfs dfs -chmod -R 777 /data 2>nul
echo [OK] HDFS ready
echo.

echo ========================================
echo   4. Flume: Logs --^> Kafka
echo ========================================
echo Starting taildir -^> Kafka agent ...
docker exec -d log_flume bash /opt/flume/bin/start-flume.sh /opt/flume/conf/taildir-kafka.conf a1 2>nul
timeout /t 10 /nobreak >nul
docker exec log_kafka kafka-topics --bootstrap-server localhost:9092 --list 2>nul
echo [OK] Kafka ready
echo.

echo ========================================
echo   5. Flume: Kafka --^> HDFS
echo ========================================
echo Starting Kafka -^> HDFS agent ...
docker exec -d log_flume bash /opt/flume/bin/start-flume.sh /opt/flume/conf/kafka-hdfs.conf a2 2>nul
timeout /t 30 /nobreak >nul
echo [INFO] Checking HDFS files ...
docker exec log_namenode hdfs dfs -ls -R /data/log_dw/ods/ 2>nul
echo [OK] Done
echo.

echo ========================================
echo   6. Hive Init
echo ========================================
echo Waiting for Hive Server2 ...
for /l %%i in (1,1,20) do (
    docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 -e "SHOW DATABASES;" 2>nul | findstr "default" >nul
    if not errorlevel 1 goto :hive_ok
    timeout /t 5 /nobreak >nul
)
echo [WARN] Hive Server2 timeout
goto :hive_done

:hive_ok
echo [OK] Hive Server2 is ready

:hive_done
echo Creating tables ...
docker exec -i log_hive_server2 beeline -u jdbc:hive2://localhost:10000 -f /opt/data-warehouse/init_all.sql 2>nul
echo [OK] Hive tables ready
echo.

echo ========================================
echo   7. Hive ODS Partition + ETL
echo ========================================
echo Syncing partitions ...
docker exec log_hive_server2 beeline -u jdbc:hive2://localhost:10000 -e "MSCK REPAIR TABLE log_dw.ods_access_log;" 2>nul
echo Running ETL pipeline (ODS -^> DWD -^> DWS -^> ADS) ...
REM Get today's date in YYYY-MM-DD format
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set ETL_DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
echo ETL date: %ETL_DATE%
docker exec -i log_hive_server2 beeline -u jdbc:hive2://localhost:10000 --hiveconf etl_date="%ETL_DATE%" -f /opt/data-warehouse/etl_pipeline.sql 2>nul
echo [OK] ETL complete
echo.

echo ========================================
echo   8. Hive -^> MySQL Import
echo ========================================
echo Importing aggregated data to MySQL ...
python scripts\hive_to_mysql.py 2>nul
if errorlevel 1 echo [WARN] MySQL import failed - try manual: python scripts\hive_to_mysql.py
echo [OK] MySQL import done
echo.

echo ========================================
echo   9. Data Verification
echo ========================================
echo MySQL table row counts:
docker exec log_mysql mysql -uloguser -plogpass123 log_analytics -e "SELECT 'kpi_daily' AS tbl, COUNT(*) AS cnt FROM kpi_daily UNION ALL SELECT 'kpi_hourly', COUNT(*) FROM kpi_hourly UNION ALL SELECT 'top_pages', COUNT(*) FROM top_pages UNION ALL SELECT 'terminal_dist', COUNT(*) FROM terminal_dist UNION ALL SELECT 'browser_dist', COUNT(*) FROM browser_dist;" 2>nul
echo.
echo Testing API ...
curl -s http://localhost:8001/api/dashboard/overview 2>nul
echo.

echo ========================================
echo   10. Pipeline Complete!
echo ========================================
echo.
echo   Frontend:       http://localhost:5173
echo   API Docs:       http://localhost:8001/docs
echo   HDFS UI:        http://localhost:9870
echo   Spark UI:       http://localhost:8080
echo   Hive UI:        http://localhost:10002
echo.
echo   Flow: log_gen -^> Flume -^> Kafka -^> Flume -^> HDFS -^> Hive -^> MySQL -^> Frontend
echo.
pause
