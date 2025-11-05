# Test login script
Start-Sleep -Seconds 3
Write-Host "Testing login..."
$response = Invoke-WebRequest -Uri http://localhost:3002/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"student@demo.com","password":"TestPassword123!"}' -UseBasicParsing
Write-Host "Response: $($response.Content)"
