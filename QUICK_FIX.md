# 🚀 QUICK FIX FOR AUTHENTICATION ISSUE

## The Problem
The backend is still expecting a `role` parameter even though we've removed it from the code.

## Root Cause
There's likely an old compiled version or cached code still running.

## Solution

### Step 1: Complete Cleanup
```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Navigate to backend
cd C:\Users\bssam\SmartSchedule\backend

# Clear all caches
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Reinstall dependencies
npm install
```

### Step 2: Start Backend
```powershell
cd C:\Users\bssam\SmartSchedule\backend
npm run dev
```

### Step 3: Test Login
```powershell
# In another terminal
Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"student@demo.com","password":"TestPassword123!"}' -UseBasicParsing
```

## Alternative: Use Different Port

If the issue persists, let's use a different port:

### 1. Update backend/src/server.ts
Change line 43 from:
```typescript
const PORT = process.env.PORT || 3001
```
to:
```typescript
const PORT = process.env.PORT || 3002
```

### 2. Update frontend
In `smart-schedule/lib/auth.ts`, change line 55 from:
```typescript
const response = await fetch('http://localhost:3001/api/auth/login', {
```
to:
```typescript
const response = await fetch('http://localhost:3002/api/auth/login', {
```

### 3. Test
```powershell
# Backend
cd C:\Users\bssam\SmartSchedule\backend
npm run dev

# Test
Invoke-WebRequest -Uri http://localhost:3002/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"student@demo.com","password":"TestPassword123!"}' -UseBasicParsing
```

## Expected Result
You should see a successful login response with user data, NOT an error about role being required.

## If Still Not Working

The issue might be that there's a different server or validation middleware running. In that case:

1. **Check what's running on port 3001:**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Kill any processes using that port:**
   ```powershell
   taskkill /F /PID [PID_NUMBER]
   ```

3. **Use a completely different port (3003, 3004, etc.)**

## Success Indicators
- ✅ Backend starts without errors
- ✅ Login request returns user data (not role error)
- ✅ Frontend can connect to backend
- ✅ No "Failed to fetch" errors

Please try these steps and let me know what happens!
