# SmartSchedule Docker Development Stack Startup Script
# Run this script to start the entire development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SmartSchedule Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if we're in the project directory
if (-not (Test-Path "docker-compose.yml") -and -not (Test-Path "docker-compose.dev.yml")) {
    Write-Host "✗ Please run this script from the SmartSchedule project root directory" -ForegroundColor Red
    exit 1
}

# Determine which compose file to use
if (Test-Path "docker-compose.yml") {
    $composeFile = "docker-compose.yml"
} else {
    $composeFile = "docker-compose.dev.yml"
}

Write-Host "✓ Using compose file: $composeFile" -ForegroundColor Green
Write-Host ""

# Stop and remove existing containers
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker compose -f $composeFile down -v 2>$null
Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Build and start containers
Write-Host "Building and starting containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
docker compose -f $composeFile up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Containers started successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "Container Status:" -ForegroundColor Cyan
    docker compose -f $composeFile ps
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Access the application:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host "  Health:   http://localhost:3001/healthz" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To view logs:" -ForegroundColor Yellow
    Write-Host "  docker compose -f $composeFile logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop containers:" -ForegroundColor Yellow
    Write-Host "  docker compose -f $composeFile down" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Failed to start containers. Check the errors above." -ForegroundColor Red
    exit 1
}

