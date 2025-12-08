# Fix 502 Bad Gateway Error on Railway

## What 502 Bad Gateway Means

A 502 error means Railway can reach your service, but the application inside is not responding. This usually means:

1. **Backend service crashed on startup**
2. **Backend is not listening on the correct port**
3. **Database connection failed**
4. **Missing environment variables**
5. **Application errors preventing startup**

## Step 1: Check Railway Logs

**This is the most important step!**

1. Go to Railway Dashboard → **backend** service
2. Click on **Logs** tab
3. Look for error messages

**Common errors to look for:**

### Error: Cannot connect to database
```
P1001: Can't reach database server
```
**Fix:** Check `DATABASE_URL` in backend variables

### Error: Missing environment variable
```
JWT_SECRET is required
```
**Fix:** Add missing environment variables

### Error: Port already in use
```
Error: listen EADDRINUSE: address already in use
```
**Fix:** Railway handles ports automatically - don't set PORT manually

### Error: Prisma Client not generated
```
Cannot find module '@prisma/client'
```
**Fix:** Check if migrations ran successfully

## Step 2: Check Backend Service Status

1. Railway Dashboard → **backend** service → **Deployments**
2. Check the latest deployment:
   - ✅ **Green/Success:** Deployment succeeded but app might be crashing
   - ❌ **Red/Failed:** Build or deployment failed
   - ⏳ **In Progress:** Still deploying

## Step 3: Verify Required Environment Variables

Go to Railway Dashboard → **backend** service → **Variables**

**Required variables:**
```
DATABASE_URL=postgresql://... (from Railway Postgres)
JWT_SECRET=your-very-long-secret-key-minimum-32-characters
NODE_ENV=production
PORT=3001 (or let Railway set it automatically)
```

**Optional but recommended:**
```
FRONTEND_URL=https://your-frontend-domain.railway.app
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app
```

## Step 4: Check Database Connection

The backend needs to connect to PostgreSQL.

1. **Verify Postgres service is running:**
   - Railway Dashboard → Check if Postgres service exists
   - Should show "Active" status

2. **Get DATABASE_URL:**
   - Railway Dashboard → **Postgres** service → **Variables**
   - Copy the `DATABASE_URL` or `POSTGRES_URL`
   - Paste it into **backend** service → **Variables** → `DATABASE_URL`

3. **Test database connection:**
   - Check backend logs for database connection errors
   - Look for: `P1001`, `connection`, `database`

## Step 5: Check Backend Startup Process

The backend should:
1. Run database migrations
2. Generate Prisma Client
3. Start the Express server
4. Listen on the port Railway provides

**Check logs for:**
```
🔄 Running database migrations...
✅ Migrations completed successfully
🚀 Starting application server...
🚀 Server running on 0.0.0.0:PORT
```

If you don't see these messages, the startup is failing.

## Common Fixes

### Fix 1: Database Connection Failed

**Symptoms:** Logs show `P1001` or `Can't reach database server`

**Solution:**
1. Verify Postgres service is running
2. Copy `DATABASE_URL` from Postgres service to backend service
3. Ensure DATABASE_URL includes `?sslmode=require` if needed
4. Redeploy backend

### Fix 2: Missing JWT_SECRET

**Symptoms:** Logs show `JWT_SECRET is required` or authentication errors

**Solution:**
1. Generate a strong secret: `openssl rand -base64 32`
2. Add to backend variables: `JWT_SECRET=your-generated-secret`
3. Redeploy backend

### Fix 3: Port Configuration Issue

**Symptoms:** Logs show port errors or "address already in use"

**Solution:**
1. **Don't set PORT manually** - Railway sets it automatically
2. Backend code uses: `process.env.PORT || 3001`
3. Railway will provide PORT via environment variable
4. Remove any hardcoded PORT from variables

### Fix 4: Prisma Migrations Failed

**Symptoms:** Logs show migration errors or Prisma client errors

**Solution:**
1. Check if migrations are running in entrypoint script
2. Verify DATABASE_URL is correct
3. Check if database schema is up to date
4. Look for migration errors in logs

### Fix 5: Build Errors

**Symptoms:** Deployment fails before starting

**Solution:**
1. Check build logs in Railway
2. Verify Dockerfile.prod is correct
3. Check for TypeScript compilation errors
4. Ensure all dependencies are in package.json

## Step-by-Step Recovery

1. **Check Logs First:**
   ```
   Railway Dashboard → backend → Logs
   ```
   Copy any error messages

2. **Verify Variables:**
   ```
   Railway Dashboard → backend → Variables
   ```
   Ensure DATABASE_URL and JWT_SECRET are set

3. **Check Database:**
   ```
   Railway Dashboard → Postgres service
   ```
   Verify it's running and get DATABASE_URL

4. **Redeploy:**
   ```
   Railway Dashboard → backend → Deployments → Redeploy
   ```

5. **Monitor Logs:**
   Watch the logs during deployment to see where it fails

## Quick Diagnostic Commands

If you have Railway CLI installed:

```bash
# Check service status
railway status

# View logs
railway logs

# Check variables
railway variables
```

## Still Not Working?

1. **Share the error logs** - Copy the exact error from Railway logs
2. **Check Railway status** - https://status.railway.app
3. **Verify service limits** - Check if you've hit any Railway limits
4. **Contact Railway support** - Include logs and error messages

## Expected Successful Startup Logs

When backend starts correctly, you should see:

```
🔄 Running database migrations...
✅ Migrations completed successfully
🚀 Starting application server...
🚀 Server running on 0.0.0.0:PORT
✅ Listening on 0.0.0.0:PORT (accessible from host)
📡 API URL: https://handsome-radiance-production.up.railway.app
📊 Environment: production
🌐 CORS enabled for: https://your-frontend.railway.app
```

If you don't see these, the startup is failing somewhere.

