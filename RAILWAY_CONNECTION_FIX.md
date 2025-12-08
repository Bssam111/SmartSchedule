# Railway Backend Connection Fix

## Current Issue
Frontend cannot connect to backend at `https://handsome-radiance-production.up.railway.app`

## Diagnostic Steps

### Step 1: Verify Backend is Running

1. Go to Railway Dashboard → **backend** service
2. Check the **Deployments** tab - is the latest deployment successful?
3. Check the **Metrics** tab - is the service receiving requests?
4. Check the **Logs** tab - are there any errors?

### Step 2: Test Backend Health Endpoint

Open these URLs in your browser:

1. **Simple health check (no DB):**
   ```
   https://handsome-radiance-production.up.railway.app/healthz
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Full health check (with DB):**
   ```
   https://handsome-radiance-production.up.railway.app/api/health
   ```
   Should return: `{"status":"healthy","timestamp":"...","database":"connected"}`

**If these don't work:**
- Backend service might not be running
- Check Railway logs for errors
- Verify the backend service is deployed and running

### Step 3: Check CORS Configuration

The backend needs to allow your frontend domain. Check your **backend** service variables:

**Required Variable:**
```
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app,https://handsome-radiance-production.up.railway.app
```

OR

```
FRONTEND_URL=https://your-frontend-domain.railway.app
```

**To find your frontend domain:**
1. Go to Railway Dashboard → **frontend** service → **Settings**
2. Copy the **Public Domain** URL
3. Add it to backend's `ALLOWED_ORIGINS` or `FRONTEND_URL`

### Step 4: Verify Backend Port

Railway automatically sets the `PORT` environment variable. Your backend should:
- Listen on `process.env.PORT` (Railway sets this automatically)
- The public domain routes to this port automatically

**Check backend logs** - you should see:
```
🚀 Server running on 0.0.0.0:PORT
```

### Step 5: Check Backend Environment Variables

In your **backend** service → **Variables**, ensure you have:

**Required:**
```
DATABASE_URL=postgresql://... (Railway Postgres connection string)
JWT_SECRET=your-secret-key
PORT=3001 (or let Railway set it automatically)
NODE_ENV=production
```

**CORS Configuration (choose one):**
```
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app
```
OR
```
FRONTEND_URL=https://your-frontend-domain.railway.app
```

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Symptoms:** Health endpoints return connection refused
**Solution:**
- Check Railway logs for startup errors
- Verify database connection (DATABASE_URL)
- Check if migrations ran successfully
- Restart the backend service

### Issue 2: CORS Errors
**Symptoms:** Browser console shows CORS errors
**Solution:**
- Add frontend domain to `ALLOWED_ORIGINS` in backend
- Format: `ALLOWED_ORIGINS=https://frontend-domain.railway.app`
- Redeploy backend after changing variables

### Issue 3: Wrong Port
**Symptoms:** Connection refused or timeout
**Solution:**
- Railway sets PORT automatically - don't override it
- Backend should use `process.env.PORT || 3001`
- Check Railway logs to see what port it's using

### Issue 4: Database Connection Failed
**Symptoms:** `/api/health` returns `"database":"disconnected"`
**Solution:**
- Verify `DATABASE_URL` is correct in backend variables
- Check Railway Postgres service is running
- Verify database migrations completed

## Quick Fix Checklist

- [ ] Backend service is deployed and running (check Deployments tab)
- [ ] Health endpoint works: `https://handsome-radiance-production.up.railway.app/healthz`
- [ ] Frontend domain is in backend's `ALLOWED_ORIGINS` or `FRONTEND_URL`
- [ ] Backend has `DATABASE_URL` set correctly
- [ ] Backend has `JWT_SECRET` set
- [ ] Both services are on the same Railway project (for internal networking)

## Testing the Connection

1. **Test in browser:**
   ```
   https://handsome-radiance-production.up.railway.app/healthz
   ```

2. **Test with curl:**
   ```bash
   curl https://handsome-radiance-production.up.railway.app/healthz
   ```

3. **Check browser console:**
   - Open frontend in browser
   - Open DevTools → Console
   - Look for API errors
   - Check Network tab for failed requests

## Still Not Working?

1. **Check Railway Logs:**
   - Backend service → Logs tab
   - Look for errors, connection issues, or startup problems

2. **Verify Service Status:**
   - Both frontend and backend should show "Active" status
   - Check if any services are paused or stopped

3. **Network Issues:**
   - Verify both services are in the same Railway project
   - Check if Railway is experiencing any outages

4. **Contact Support:**
   - Railway support: https://railway.app/help
   - Include logs and error messages

