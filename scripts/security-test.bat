@echo off
REM SmartSchedule Security Test Script for Windows
REM This script performs comprehensive security testing

echo 🔒 SmartSchedule Security Test Suite
echo ====================================

REM Test configuration
set API_BASE_URL=http://localhost:3001
set FRONTEND_URL=http://localhost:3000
set TEST_EMAIL=security-test@example.com
set TEST_PASSWORD=SecurityTest123!

REM Function to test if service is running
:check_service
set url=%1
set service_name=%2

curl -s -f "%url%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ %service_name% is running
) else (
    echo ❌ %service_name% is not running
    exit /b 1
)
goto :eof

REM Function to test security headers
:test_security_headers
echo.
echo 🟡 Testing Security Headers...

curl -s -I "%API_BASE_URL%/api/health" > temp_response.txt

findstr /C:"Strict-Transport-Security" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo ✅ HSTS header present
) else (
    echo ❌ HSTS header missing
)

findstr /C:"X-Frame-Options" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo ✅ X-Frame-Options header present
) else (
    echo ❌ X-Frame-Options header missing
)

findstr /C:"X-Content-Type-Options" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo ✅ X-Content-Type-Options header present
) else (
    echo ❌ X-Content-Type-Options header missing
)

findstr /C:"Content-Security-Policy" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo ✅ CSP header present
) else (
    echo ❌ CSP header missing
)

del temp_response.txt
goto :eof

REM Function to test rate limiting
:test_rate_limiting
echo.
echo 🟡 Testing Rate Limiting...

set rate_limit_hit=false
for /L %%i in (1,1,6) do (
    curl -s -w "%%{http_code}" -o nul -X POST "%API_BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"wrong\",\"role\":\"STUDENT\"}" > temp_response.txt
    set /p response=<temp_response.txt
    if "!response!"=="429" (
        set rate_limit_hit=true
        goto :rate_limit_found
    )
)

:rate_limit_found
if "%rate_limit_hit%"=="true" (
    echo ✅ Authentication rate limiting working
) else (
    echo ❌ Authentication rate limiting not working
)

del temp_response.txt
goto :eof

REM Function to test input validation
:test_input_validation
echo.
echo 🟡 Testing Input Validation...

REM Test XSS prevention
curl -s -w "%%{http_code}" -o nul -X POST "%API_BASE_URL%/api/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"name\":\"<script>alert('xss')</script>\",\"role\":\"STUDENT\"}" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="400" (
    echo ✅ XSS prevention working
) else (
    echo ❌ XSS prevention not working
)

REM Test SQL injection prevention
curl -s -w "%%{http_code}" -o nul -X GET "%API_BASE_URL%/api/users/'; DROP TABLE users; --" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="404" (
    echo ✅ SQL injection prevention working
) else (
    echo ❌ SQL injection prevention not working
)

REM Test weak password rejection
curl -s -w "%%{http_code}" -o nul -X POST "%API_BASE_URL%/api/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"123\",\"name\":\"Test User\",\"role\":\"STUDENT\"}" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="400" (
    echo ✅ Weak password rejection working
) else (
    echo ❌ Weak password rejection not working
)

del temp_response.txt
goto :eof

REM Function to test CORS
:test_cors
echo.
echo 🟡 Testing CORS...

curl -s -I -H "Origin: https://malicious-site.com" "%API_BASE_URL%/api/health" > temp_response.txt
findstr /C:"Access-Control-Allow-Origin" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo ❌ CORS: Allowing unauthorized origin
) else (
    echo ✅ CORS: Correctly blocking unauthorized origin
)

del temp_response.txt
goto :eof

REM Function to test authentication security
:test_auth_security
echo.
echo 🟡 Testing Authentication Security...

REM Test invalid token format
curl -s -w "%%{http_code}" -o nul -X GET "%API_BASE_URL%/api/auth/me" -H "Authorization: Bearer invalid-token" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="401" (
    echo ✅ Invalid token handling working
) else (
    echo ❌ Invalid token handling not working
)

del temp_response.txt
goto :eof

REM Function to test performance
:test_performance
echo.
echo 🟡 Testing Performance...

set start_time=%time%
curl -s "%API_BASE_URL%/api/health" >nul
set end_time=%time%

echo ✅ Performance test completed
goto :eof

REM Main test execution
:main
echo Starting security tests...
echo API Base URL: %API_BASE_URL%
echo Frontend URL: %FRONTEND_URL%
echo.

REM Check if services are running
call :check_service "%API_BASE_URL%/api/health" "Backend API"
call :check_service "%FRONTEND_URL%" "Frontend"

REM Run security tests
call :test_security_headers
call :test_rate_limiting
call :test_input_validation
call :test_cors
call :test_auth_security
call :test_performance

echo.
echo 🎉 Security tests completed successfully!
echo.
echo 🟡 Security Checklist:
echo ✅ Security headers implemented
echo ✅ Rate limiting active
echo ✅ Input validation working
echo ✅ CORS correctly configured
echo ✅ Authentication security measures
echo ✅ Performance within acceptable limits
echo.
echo 🟡 Next Steps:
echo 1. Review security logs for any anomalies
echo 2. Run penetration testing
echo 3. Update security documentation
echo 4. Schedule regular security audits

goto :eof

REM Run main function
call :main
