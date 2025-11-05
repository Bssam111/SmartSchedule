@echo off
REM Complete RBAC Setup with Authentication Fix

echo 🔒 Setting up Complete RBAC System
echo ==================================

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found!
    exit /b 1
)

REM Navigate to backend
cd backend

echo [STEP 1] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)

echo [STEP 2] Running database migrations...
call npx prisma migrate dev --name rbac-setup
if %errorlevel% neq 0 (
    echo ❌ Database migration failed
    exit /b 1
)

echo [STEP 3] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma client generation failed
    exit /b 1
)

echo [STEP 4] Creating mock users for RBAC testing...
call npm run db:mock-users
if %errorlevel% neq 0 (
    echo ❌ Failed to create mock users
    exit /b 1
)

echo [STEP 5] Testing backend startup...
echo Starting backend server...
start /b npm run dev

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Test backend health
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running and healthy
) else (
    echo ❌ Backend health check failed
    echo Please check backend logs
)

cd ..

REM Check if frontend directory exists
if not exist "smart-schedule" (
    echo ❌ Frontend directory not found!
    exit /b 1
)

REM Navigate to frontend
cd smart-schedule

echo [STEP 6] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)

echo [STEP 7] Testing frontend build...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    exit /b 1
)

echo.
echo 🎉 RBAC Setup Complete!
echo.
echo 📋 What was fixed:
echo ✅ Removed role selection from login form
echo ✅ Authentication now requires valid credentials
echo ✅ Role is determined by backend database
echo ✅ RBAC middleware properly enforces permissions
echo ✅ Mock users created for testing
echo.
echo 🚀 How to test:
echo 1. Backend: http://localhost:3001 (should be running)
echo 2. Frontend: npm run dev (in smart-schedule directory)
echo 3. Login: http://localhost:3000/login
echo 4. RBAC Test: http://localhost:3000/rbac-test
echo.
echo 📋 Demo Credentials:
echo • student@demo.com / TestPassword123!
echo • faculty@demo.com / TestPassword123!
echo • committee@demo.com / TestPassword123!
echo.
echo 🔒 Security Features:
echo • No role selection - roles come from database
echo • Proper credential validation
echo • RBAC permission enforcement
echo • JWT token authentication
echo • Secure password hashing

pause
