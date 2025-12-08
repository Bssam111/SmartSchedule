# Quick Railway Connection Fix

## Most Likely Issues (Check These First!)

### ✅ Issue #1: Backend CORS Not Configured (90% of cases)

Your backend needs to allow your frontend domain. 

**Fix:**
1. Go to Railway Dashboard → **backend** service → **Variables**
2. Find your frontend domain:
   - Go to **frontend** service → **Settings** → Copy the **Public Domain**
3. Add to backend variables:
   ```
   ALLOWED_ORIGINS=https://your-frontend-domain.railway.app
   ```
   OR
   ```
   FRONTEND_URL=https://your-frontend-domain.railway.app
   ```
4. **Redeploy backend** (Railway will auto-redeploy)

### ✅ Issue #2: Backend Not Running

**Check:**
1. Railway Dashboard → **backend** service → **Deployments**
2. Is the latest deployment **successful**?
3. Check **Logs** tab for errors

**Test backend directly:**
Open in browser: `https://handsome-radiance-production.up.railway.app/healthz`

- ✅ **Works:** Backend is running, issue is CORS or frontend config
- ❌ **Doesn't work:** Backend is not running or has errors

### ✅ Issue #3: Backend Database Connection Failed

**Check backend logs** for database errors:
- Railway Dashboard → **backend** service → **Logs**
- Look for: `P1001`, `database`, `connection`, `DATABASE_URL`

**Fix:**
- Verify `DATABASE_URL` is set in backend variables
- Check Railway Postgres service is running
- Verify database migrations completed

## Quick Test Commands

### Test Backend Health (in browser):
```
https://handsome-radiance-production.up.railway.app/healthz
```

### Test Backend API (in browser):
```
https://handsome-radiance-production.up.railway.app/api/health
```

### Expected Responses:

**/healthz:**
```json
{"status":"ok","timestamp":"2024-..."}
```

**/api/health:**
```json
{"status":"healthy","timestamp":"2024-...","database":"connected","service":"SmartSchedule API"}
```

## Step-by-Step Fix

1. **Test backend health:**
   - Open: `https://handsome-radiance-production.up.railway.app/healthz`
   - If it works → backend is running ✅
   - If it doesn't → backend has issues ❌

2. **Check CORS:**
   - Go to backend → Variables
   - Add your frontend domain to `ALLOWED_ORIGINS`
   - Format: `https://your-frontend.railway.app`

3. **Redeploy:**
   - Backend will auto-redeploy when you save variables
   - Or manually trigger: Deployments → Redeploy

4. **Test frontend:**
   - Open your frontend
   - Check browser console
   - Should see API calls to Railway backend

## Still Not Working?

Check Railway logs:
- Backend service → Logs tab
- Look for startup errors, database errors, or port issues

Common log errors:
- `Cannot connect to database` → Check DATABASE_URL
- `Port already in use` → Railway handles this automatically
- `CORS error` → Add frontend domain to ALLOWED_ORIGINS

