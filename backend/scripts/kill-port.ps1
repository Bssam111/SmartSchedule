# PowerShell script to kill process on port (Windows)
param(
    [int]$Port = 3001
)

Write-Host "🔍 Checking for process on port $Port..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "🛑 Killing process $pid ($($process.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # Process might have already terminated
        }
    }
    Write-Host "✅ Killed process(es) on port $Port" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No process found on port $Port" -ForegroundColor Gray
}

