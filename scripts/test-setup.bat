@echo off
REM Quick setup test for RBAC demo

echo 🔒 Testing RBAC Setup
echo ====================

REM Check if backend is running
echo [INFO] Checking backend...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not running. Please start it with: cd backend ^&^& npm run dev
    exit /b 1
)

REM Check if frontend is running
echo [INFO] Checking frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend is not running. Please start it with: cd smart-schedule ^&^& npm run dev
    exit /b 1
)

echo.
echo 🎉 Setup test completed!
echo.
echo 📋 Next Steps:
echo 1. Open http://localhost:3000/login
echo 2. Login with demo credentials
echo 3. Visit http://localhost:3000/rbac-test
echo 4. Test different roles and permissions
echo.
echo 📋 Demo Credentials:
echo • student@demo.com / TestPassword123! / student
echo • faculty@demo.com / TestPassword123! / faculty  
echo • committee@demo.com / TestPassword123! / committee

pause
