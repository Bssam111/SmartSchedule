@echo off
REM SmartSchedule RBAC Demo Setup Script for Windows
REM This script sets up the RBAC system with mock users for testing

echo 🔒 SmartSchedule RBAC Demo Setup
echo ==================================

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo ❌ Please run this script from the SmartSchedule root directory
    exit /b 1
)

REM Step 1: Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Step 2: Setup database
echo [INFO] Setting up database...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to push database schema
    exit /b 1
)
echo ✅ Database setup completed

REM Step 3: Create mock users
echo [INFO] Creating mock users...
call npm run db:mock-users
if %errorlevel% neq 0 (
    echo ❌ Failed to create mock users
    exit /b 1
)
echo ✅ Mock users created

REM Step 4: Build backend
echo [INFO] Building backend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build backend
    exit /b 1
)
echo ✅ Backend built successfully

REM Step 5: Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd ..\smart-schedule
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)
echo ✅ Frontend dependencies installed

REM Step 6: Build frontend
echo [INFO] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    exit /b 1
)
echo ✅ Frontend built successfully

cd ..

echo.
echo 🎉 RBAC Demo Setup Completed!
echo ==================================

echo.
echo 📋 Demo Login Credentials:
echo ┌─────────────────────┬─────────────────────┬─────────────┐
echo │ Email               │ Password            │ Role        │
echo ├─────────────────────┼─────────────────────┼─────────────┤
echo │ student@demo.com    │ TestPassword123!    │ STUDENT     │
echo │ faculty@demo.com    │ TestPassword123!    │ FACULTY     │
echo │ committee@demo.com  │ TestPassword123!    │ COMMITTEE   │
echo │ admin@demo.com      │ TestPassword123!    │ COMMITTEE   │
echo └─────────────────────┴─────────────────────┴─────────────┘

echo.
echo 🚀 How to Test RBAC:
echo 1. Start the backend: cd backend ^&^& npm run dev
echo 2. Start the frontend: cd smart-schedule ^&^& npm run dev
echo 3. Open http://localhost:3000/login
echo 4. Login with different roles to test permissions
echo 5. Visit http://localhost:3000/rbac-test to run permission tests

echo.
echo 🔧 RBAC Test Endpoints:
echo • GET  /api/rbac-test/test-rbac - Basic RBAC test
echo • GET  /api/rbac-test/users - Test user read permission
echo • POST /api/rbac-test/users - Test user create permission
echo • PUT  /api/rbac-test/users/:id - Test user update permission
echo • DELETE /api/rbac-test/users/:id - Test user delete permission
echo • GET  /api/rbac-test/permissions - View permission matrix

echo.
echo 📊 Expected Results:
echo • STUDENT: Can only access basic endpoints, denied admin functions
echo • FACULTY: Can access most endpoints, denied admin functions
echo • COMMITTEE: Can access all endpoints including admin functions

echo.
echo ✅ Setup completed successfully!
echo 💡 Tip: Use different browser tabs to test different roles

pause
