# Verify Docker Setup Script
# Checks if Docker is ready and all containers are running properly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SmartSchedule Docker Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check Docker is running
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   ✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker is not running" -ForegroundColor Red
    $errors += "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Check Docker Compose files
Write-Host "2. Checking Docker Compose files..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "   ✓ docker-compose.yml found" -ForegroundColor Green
    $composeFile = "docker-compose.yml"
} elseif (Test-Path "docker-compose.dev.yml") {
    Write-Host "   ✓ docker-compose.dev.yml found" -ForegroundColor Green
    $composeFile = "docker-compose.dev.yml"
} else {
    Write-Host "   ✗ No docker-compose file found" -ForegroundColor Red
    $errors += "No docker-compose.yml or docker-compose.dev.yml found in project root."
}

# Check if containers are running
Write-Host "3. Checking container status..." -ForegroundColor Yellow
if ($composeFile) {
    $containers = docker compose -f $composeFile ps --format json 2>$null | ConvertFrom-Json
    
    if ($containers) {
        foreach ($container in $containers) {
            $status = $container.State
            $name = $container.Service
            
            if ($status -eq "running") {
                Write-Host "   ✓ $name is running" -ForegroundColor Green
            } else {
                Write-Host "   ✗ $name is not running (Status: $status)" -ForegroundColor Red
                $errors += "$name container is not running."
            }
        }
    } else {
        Write-Host "   ⚠ No containers found. Run 'docker compose up -d' to start them." -ForegroundColor Yellow
        $warnings += "Containers are not running."
    }
}

# Check ports
Write-Host "4. Checking ports..." -ForegroundColor Yellow
$ports = @(3000, 3001, 5432)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   ✓ Port $port is in use" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Port $port is not in use (containers may not be running)" -ForegroundColor Yellow
    }
}

# Test health endpoints
Write-Host "5. Testing health endpoints..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($backendHealth.StatusCode -eq 200) {
        Write-Host "   ✓ Backend health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Backend health check failed: $_" -ForegroundColor Red
    $errors += "Backend health check failed. Check if backend container is running."
}

try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Host "   ✓ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠ Frontend is not accessible (containers may still be starting)" -ForegroundColor Yellow
    $warnings += "Frontend is not accessible yet."
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✓ All checks passed! Docker setup is working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
    exit 0
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠ Setup is mostly working, but there are some warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    exit 0
} else {
    Write-Host "✗ Setup issues found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Run 'docker compose logs -f' to see container logs" -ForegroundColor Gray
    Write-Host "  - Run 'docker compose ps' to see container status" -ForegroundColor Gray
    Write-Host "  - Check DOCKER_SETUP.md for detailed troubleshooting" -ForegroundColor Gray
    exit 1
}




