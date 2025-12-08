# Fix: Backend Binding to localhost Instead of 0.0.0.0

## Problem

Your backend logs show:
```
Server running on localhost:3001
Environment: development
```

But Railway needs the server to bind to `0.0.0.0` (all interfaces), not `localhost` (only local interface).

## Root Cause

The `NODE_ENV` environment variable is not set to `production` in Railway, so the server defaults to `localhost`.

## Quick Fix

### Option 1: Set NODE_ENV in Railway (Recommended)

1. Go to Railway Dashboard → **backend** service → **Variables**
2. Add or update:
   ```
   NODE_ENV=production
   ```
3. **Redeploy** the backend service

After redeploy, logs should show:
```
Server running on 0.0.0.0:PORT
✅ Listening on 0.0.0.0:PORT (accessible from host)
Environment: production
```

### Option 2: Code Already Updated

I've updated the code to also check for `RAILWAY_ENVIRONMENT` (which Railway sets automatically), so it should work even without `NODE_ENV=production`. But setting `NODE_ENV=production` is still recommended.

## Verification

After setting `NODE_ENV=production` and redeploying:

1. Check deploy logs - should show:
   ```
   Server running on 0.0.0.0:PORT
   ✅ Listening on 0.0.0.0:PORT (accessible from host)
   ```

2. Test health endpoint:
   ```
   https://handsome-radiance-production.up.railway.app/healthz
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. Check HTTP logs - should show `200` instead of `502`

## Why This Matters

- `localhost` binding: Only accessible from within the container itself
- `0.0.0.0` binding: Accessible from outside the container (Railway can route traffic to it)

Railway's load balancer needs to reach your app from outside the container, so it must listen on `0.0.0.0`.

