# Railway Database Connection Fix

## Problem

Backend logs show:
```
Error: P1001: Can't reach database server at `postgres.railway.internal:5432`
```

This means the backend service cannot connect to the PostgreSQL database service.

## Root Causes

1. **Database service not running** - PostgreSQL service is stopped or crashed
2. **Services not in same project** - Backend and database must be in the same Railway project
3. **DATABASE_URL not set** - Environment variable missing or incorrect
4. **Network issue** - Services can't communicate internally

## Step-by-Step Fix

### Step 1: Verify Database Service is Running

1. Go to Railway Dashboard
2. Check if PostgreSQL service exists and is **Running** (green status)
3. If not running, click "Start" or "Deploy"

### Step 2: Verify Services Are in Same Project

1. Both backend and database services must be in the **same Railway project**
2. If they're in different projects, you need to:
   - Either move them to the same project
   - Or use the public database URL (not recommended for production)

### Step 3: Check DATABASE_URL Environment Variable

1. Go to Railway Dashboard → Backend Service → Variables
2. Verify `DATABASE_URL` is set
3. It should look like:
   ```
   postgresql://user:password@postgres.railway.internal:5432/railway
   ```
   OR (if using public URL):
   ```
   postgresql://user:password@containers-us-west-xxx.railway.app:5432/railway
   ```

### Step 4: Link Database to Backend Service

If `DATABASE_URL` is not automatically set:

1. Go to Railway Dashboard → Backend Service
2. Click "Variables" tab
3. Click "New Variable"
4. Click "Reference Variable" (or "Generate from Service")
5. Select your PostgreSQL service
6. Select `DATABASE_URL` or `POSTGRES_URL`
7. Railway will automatically create the reference

### Step 5: Verify Database Connection

After setting `DATABASE_URL`, check backend logs. You should see:
```
✅ Database connection successful
🔄 Running database migrations...
✅ Migrations completed successfully
```

## Common Issues

### Issue 1: Database Service Not Found

**Symptoms**: No PostgreSQL service in Railway project

**Solution**:
1. Create a new PostgreSQL service in Railway
2. Railway will automatically provide `DATABASE_URL`
3. Link it to your backend service

### Issue 2: DATABASE_URL Points to Wrong Service

**Symptoms**: Connection fails even though database is running

**Solution**:
1. Delete the current `DATABASE_URL` variable
2. Re-link it using "Reference Variable" from the database service
3. Redeploy backend service

### Issue 3: Services in Different Projects

**Symptoms**: Can't reference database service from backend

**Solution**:
1. Move both services to the same Railway project
2. Or use the public database URL (less secure, not recommended)

### Issue 4: Database Service Crashed

**Symptoms**: Database service shows "Stopped" or "Error"

**Solution**:
1. Check database service logs for errors
2. Restart the database service
3. If it keeps crashing, check database resource limits
4. Consider upgrading database plan if needed

## Railway-Specific Notes

### Internal vs Public URLs

Railway provides two types of database URLs:

1. **Internal URL** (Recommended):
   ```
   postgresql://...@postgres.railway.internal:5432/railway
   ```
   - Only works within the same Railway project
   - More secure (not exposed publicly)
   - Faster (internal network)

2. **Public URL**:
   ```
   postgresql://...@containers-us-west-xxx.railway.app:5432/railway
   ```
   - Works from anywhere
   - Less secure (exposed publicly)
   - Slower (goes through internet)

**For production, always use internal URLs when possible.**

### Automatic Variable Linking

Railway automatically creates `DATABASE_URL` when:
- You create a PostgreSQL service
- You link a service to a database

If `DATABASE_URL` is missing:
1. Go to Backend Service → Variables
2. Click "New Variable" → "Reference Variable"
3. Select PostgreSQL service → `DATABASE_URL`

## Verification Steps

After fixing, verify:

1. **Database service is running** (green status in Railway)
2. **DATABASE_URL is set** in backend service variables
3. **Backend logs show successful connection**:
   ```
   ✅ Database connection successful
   ✅ Migrations completed successfully
   ```
4. **Backend can query database** (check `/api/health` endpoint)

## Test Database Connection

You can test the database connection by checking the health endpoint:

```bash
curl https://your-backend.up.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## Still Not Working?

1. **Check Railway Status**: Visit status.railway.app
2. **Check Service Logs**: Look for database connection errors
3. **Verify Network**: Ensure services are in same project
4. **Check Resource Limits**: Database might be hitting limits
5. **Contact Railway Support**: If issue persists

## Quick Checklist

- [ ] Database service exists and is running
- [ ] Backend and database are in same Railway project
- [ ] `DATABASE_URL` is set in backend service variables
- [ ] `DATABASE_URL` uses internal URL format (postgres.railway.internal)
- [ ] Backend service has been redeployed after setting `DATABASE_URL`
- [ ] Backend logs show successful database connection

