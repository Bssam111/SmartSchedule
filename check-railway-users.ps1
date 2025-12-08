# Script to check users in Railway database
# This will help identify which credentials to use for login

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Railway Database Users" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test database connection through backend API
Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    $healthData = $healthCheck.Content | ConvertFrom-Json
    Write-Host "✅ Database connection: $($healthData.database)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to backend API" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "To check users in Railway database, you can:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Use Prisma Studio (web interface):" -ForegroundColor White
Write-Host "   docker compose exec backend npx prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Query through backend API (if endpoint exists)" -ForegroundColor White
Write-Host ""
Write-Host "3. Check Railway dashboard:" -ForegroundColor White
Write-Host "   https://railway.app - Check your database users" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend is connected to Railway database" -ForegroundColor Green
Write-Host "Host: yamanote.proxy.rlwy.net:16811" -ForegroundColor Gray
Write-Host "Database: railway" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan




