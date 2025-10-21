@echo off
REM ============================================
REM Docker Initialization Script (Windows)
REM Prepares Docker environment for SmartSchedule
REM ============================================

setlocal enabledelayedexpansion

echo ========================================
echo   SmartSchedule Docker Initialization
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed
    echo Please install Docker: https://docs.docker.com/get-docker/
    exit /b 1
)
echo [OK] Docker is installed

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed
    echo Please install Docker Compose: https://docs.docker.com/compose/install/
    exit /b 1
)
echo [OK] Docker Compose is installed

REM Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running
    echo Please start Docker Desktop
    exit /b 1
)
echo [OK] Docker daemon is running

echo.
echo Setting up environment...

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file from example...
    copy env.docker.example .env >nul
    
    REM Generate random strings (Windows doesn't have easy random generation)
    REM User should manually update these values
    echo [WARNING] Please edit .env file and set secure values for:
    echo   - JWT_SECRET
    echo   - POSTGRES_PASSWORD
    echo.
) else (
    echo [OK] .env file already exists
)

REM Create directories
if not exist backups mkdir backups
echo [OK] Created backups directory

if not exist logs mkdir logs
echo [OK] Created logs directory

echo.
echo Building Docker images...
echo This may take several minutes on first run
echo.

docker-compose build --no-cache

echo.
echo [OK] Docker images built successfully

echo.
echo Starting services...
docker-compose up -d

echo.
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo Running database migrations...
docker-compose exec -T backend npx prisma migrate deploy

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Application URLs:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo   Health:    http://localhost:3001/api/health
echo.
echo Useful commands:
echo   docker-compose logs -f    - View logs
echo   docker-compose ps         - Check status
echo   docker-compose down       - Stop services
echo.
echo Note: Edit .env file to customize configuration
echo.

endlocal
