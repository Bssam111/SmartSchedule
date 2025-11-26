# Database Connection Fix - P1001 Error

## Critical Error
```
Error: P1001: Can't reach database server at 'postgres.railway.internal:5432'
```

This means the backend **cannot connect to the Postgres database**. This is why all logins fail - the backend can't even check if users exist!

## Root Cause
After the last push, the backend service lost connection to the database. Possible reasons:
1. **DATABASE_URL** environment variable is missing or incorrect
2. **Postgres service** is down or restarting
3. **Network connectivity** issue between services
4. **Backend service** needs restart

## Immediate Fix Steps

### Step 1: Verify Postgres Service is Running
1. Go to Railway → **Postgres** service
2. Check status - should show **"Active"**
3. If not active, wait for it to start or restart it

### Step 2: Verify DATABASE_URL in Backend Service
1. Go to Railway → **backend** service → **Variables** tab
2. Look for **DATABASE_URL**
3. Should be: `postgresql://postgres:...@postgres.railway.internal:5432/railway`
4. If missing or wrong:
   - Click **"+ New Variable"**
   - Click **"Reference Variable"**
   - Select **Postgres** service → **DATABASE_URL**
   - This shares the database connection

### Step 3: Restart Backend Service
1. Go to Railway → **backend** service
2. Click **Settings** → **General**
3. Click **"Restart"** or **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Check Logs After Restart
1. Go to Railway → **backend** → **Logs**
2. Should see:
   - `✅ DATABASE_URL configured`
   - `🚀 Server running on port 3001`
   - **NO** `P1001` errors

### Step 5: Test Database Connection
After restart, check logs for:
- ✅ `Prisma schema loaded`
- ✅ `Migration successful` or `Database connected`
- ❌ **NO** `Can't reach database server` errors

## If Still Failing

### Option 1: Re-link Database
1. Railway → **backend** → **Variables**
2. Delete **DATABASE_URL** variable
3. Click **"+ New Variable"** → **"Reference Variable"**
4. Select **Postgres** → **DATABASE_URL**
5. Restart backend service

### Option 2: Check Postgres Service
1. Railway → **Postgres** service
2. Check **Logs** - should show it's running
3. If errors, restart Postgres service

### Option 3: Verify Network Connection
1. Railway → **backend** → **Settings** → **Networking**
2. Should show connection to Postgres
3. Architecture diagram should show arrow from Postgres to backend

## Expected Behavior After Fix

✅ Backend logs show: `✅ DATABASE_URL configured`
✅ Backend logs show: `🚀 Server running on port 3001`
✅ **NO** `P1001` errors
✅ Login attempts can reach database
✅ Users can be found in database

## Why This Happened

The error started after the last push. This could be:
- Railway service restart cleared environment variables
- Network connectivity temporarily lost
- Postgres service restarted and backend didn't reconnect

## Quick Checklist

- [ ] Postgres service is **Active**
- [ ] Backend service has **DATABASE_URL** variable
- [ ] DATABASE_URL references **Postgres** service
- [ ] Backend service **restarted** after fixing variables
- [ ] Logs show **NO** P1001 errors
- [ ] Database connection successful

## Next Steps After Fix

Once database connection is restored:
1. **Seed the database** (if users don't exist)
2. **Test login** again
3. Should work now that backend can reach database

