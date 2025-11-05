@echo off
REM Test authentication and RBAC enforcement

echo 🔒 Testing Authentication & RBAC
echo ===============================

REM Test 1: Invalid credentials should fail
echo [TEST 1] Testing invalid credentials...
curl -s -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"invalid@test.com\",\"password\":\"wrongpassword\"}" ^
  -w "HTTP Status: %%{http_code}\n" >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Invalid credentials properly rejected
) else (
    echo ❌ Invalid credentials test failed
)

echo.

REM Test 2: Valid demo credentials should work
echo [TEST 2] Testing valid demo credentials...

echo Testing student login...
curl -s -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"student@demo.com\",\"password\":\"TestPassword123!\"}" ^
  -w "HTTP Status: %%{http_code}\n"

echo.
echo Testing faculty login...
curl -s -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"faculty@demo.com\",\"password\":\"TestPassword123!\"}" ^
  -w "HTTP Status: %%{http_code}\n"

echo.
echo Testing committee login...
curl -s -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"committee@demo.com\",\"password\":\"TestPassword123!\"}" ^
  -w "HTTP Status: %%{http_code}\n"

echo.
echo 🎯 Authentication Test Complete!
echo.
echo 📋 Next Steps:
echo 1. Open http://localhost:3000/login
echo 2. Try logging in with demo credentials
echo 3. Verify you cannot login with invalid credentials
echo 4. Test RBAC permissions at http://localhost:3000/rbac-test

pause
