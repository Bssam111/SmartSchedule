# Test Frontend Login and Protected Route
# This script tests the login flow and access-requests page

Write-Host "🧪 Testing Frontend Login and Protected Routes" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Testing Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing
    if ($health.StatusCode -eq 200) {
        Write-Host "   ✅ Backend health check: OK" -ForegroundColor Green
        $health.Content | ConvertFrom-Json | Format-List
    }
} catch {
    Write-Host "   ❌ Backend health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Frontend Login Page
Write-Host "2️⃣ Testing Frontend Login Page..." -ForegroundColor Yellow
try {
    $loginPage = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
    if ($loginPage.StatusCode -eq 200) {
        Write-Host "   ✅ Login page accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Login page not accessible: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Login API Call
Write-Host "3️⃣ Testing Login API..." -ForegroundColor Yellow
$loginBody = @{
    email = "committee@ksu.edu.sa"
    password = "password123"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -WebSession $session `
        -UseBasicParsing
    
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Host "   User: $($loginData.user.name) ($($loginData.user.role))" -ForegroundColor Cyan
        Write-Host "   Email: $($loginData.user.email)" -ForegroundColor Cyan
        
        # Check for cookies
        if ($session.Cookies.Count -gt 0) {
            Write-Host "   ✅ Cookies set: $($session.Cookies.Count) cookie(s)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Test 4: Protected Route - Access Requests
Write-Host "4️⃣ Testing Protected Route (/api/access-requests)..." -ForegroundColor Yellow
try {
    $accessResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/access-requests" `
        -Method GET `
        -WebSession $session `
        -UseBasicParsing
    
    if ($accessResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Access requests endpoint accessible" -ForegroundColor Green
        $accessData = $accessResponse.Content | ConvertFrom-Json
        if ($accessData.success) {
            Write-Host "   Data loaded successfully" -ForegroundColor Cyan
            if ($accessData.data) {
                Write-Host "   Requests found: $($accessData.data.Count)" -ForegroundColor Cyan
            }
            if ($accessData.meta) {
                Write-Host "   Total: $($accessData.meta.total)" -ForegroundColor Cyan
            }
        }
    }
} catch {
    Write-Host "   ❌ Access requests failed: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ⚠️  Authentication failed - cookies not being sent correctly" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000/login in your browser" -ForegroundColor White
Write-Host "  2. Login with: committee@ksu.edu.sa / password123" -ForegroundColor White
Write-Host "  3. Navigate to /committee/access-requests" -ForegroundColor White

