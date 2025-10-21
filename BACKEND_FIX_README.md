# 🔧 Backend Authentication Fix

## Problem
The backend is not running properly and still expects a `role` parameter in the login request.

## Solution

### Step 1: Stop all Node processes
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
killall node
```

### Step 2: Clear any cached builds
```bash
cd backend
rm -rf dist
rm -rf node_modules/.cache
```

### Step 3: Reinstall dependencies
```bash
cd backend
npm install
```

### Step 4: Start the backend
```bash
cd backend
npm run dev
```

### Step 5: Test the login endpoint
```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"student@demo.com","password":"TestPassword123!"}' -UseBasicParsing

# Linux/Mac/Git Bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@demo.com","password":"TestPassword123!"}'
```

## Expected Result
You should see a successful login response with the user's data and role.

## If Still Not Working

1. **Check the backend is actually running**:
   ```bash
   # Windows
   netstat -an | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```

2. **Check the backend logs**: Look for any error messages in the terminal where you ran `npm run dev`

3. **Verify the validation schema**:
   - Open `backend/src/utils/validation.ts`
   - Confirm that `loginSchema` only has `email` and `password` fields
   - NO `role` field should be present

4. **Start the backend manually**:
   ```bash
   cd backend
   npx tsx src/server.ts
   ```

## Quick Test Script

Save this as `test-backend.bat`:

```batch
@echo off
echo Testing Backend...
timeout /t 5 /nobreak >nul
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"student@demo.com\",\"password\":\"TestPassword123!\"}"
pause
```

Run it after starting the backend to verify everything works.

