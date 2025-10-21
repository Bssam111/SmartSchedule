@echo off
REM ============================================
REM Health Check Script (Windows)
REM Verifies all services are running correctly
REM ============================================

setlocal

echo ========================================
echo   SmartSchedule Health Check
echo ========================================
echo.

set FAILED=0

REM Check containers
echo Container Status:
echo Checking smartschedule-db...
docker ps --filter "name=smartschedule-db" --filter "status=running" | findstr "smartschedule-db" >nul
if %errorlevel% equ 0 (
    echo [OK] Database container running
) else (
    echo [FAIL] Database container not running
    set FAILED=1
)

echo Checking smartschedule-backend...
docker ps --filter "name=smartschedule-backend" --filter "status=running" | findstr "smartschedule-backend" >nul
if %errorlevel% equ 0 (
    echo [OK] Backend container running
) else (
    echo [FAIL] Backend container not running
    set FAILED=1
)

echo Checking smartschedule-frontend...
docker ps --filter "name=smartschedule-frontend" --filter "status=running" | findstr "smartschedule-frontend" >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend container running
) else (
    echo [FAIL] Frontend container not running
    set FAILED=1
)

echo.
echo Service Health:
echo Checking backend API...
curl -sf http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API healthy
) else (
    echo [FAIL] Backend API unhealthy
    set FAILED=1
)

echo Checking frontend...
curl -sf http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend healthy
) else (
    echo [FAIL] Frontend unhealthy
    set FAILED=1
)

echo.
echo Database Connectivity:
docker-compose exec -T database pg_isready -U smartschedule >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL connected
) else (
    echo [FAIL] PostgreSQL connection failed
    set FAILED=1
)

echo.
if %FAILED% equ 0 (
    echo ========================================
    echo   All checks passed!
    echo ========================================
) else (
    echo ========================================
    echo   Some checks failed!
    echo ========================================
    echo.
    echo Troubleshooting tips:
    echo 1. Check logs: docker-compose logs
    echo 2. Restart services: docker-compose restart
    echo 3. Rebuild: docker-compose down ^&^& docker-compose up -d --build
)

exit /b %FAILED%
