# Railway Variables Configuration Fix

## Current Issue

Your frontend is trying to connect to `localhost:3001` because some environment variables are set to **internal Railway URLs** that browsers cannot access.

## Your Current Variables (WRONG ❌)

In your **frontend** service on Railway:

- ✅ `NEXT_PUBLIC_API_BASE_URL`: `https://handsome-radiance-production.up.railway.app` (CORRECT!)
- ❌ `NEXT_PUBLIC_API_URL`: `handsome-radiance.railway.internal` (WRONG - internal URL)
- ❌ `NEXT_PUBLIC_EXTERNAL_API_URL`: `handsome-radiance.railway.internal` (WRONG - internal URL)

## What You Need to Change

Update your **frontend** service variables in Railway:

### ✅ Correct Configuration

1. **Keep this one (it's correct):**
   ```
   NEXT_PUBLIC_API_BASE_URL = https://handsome-radiance-production.up.railway.app
   ```

2. **Update this one:**
   ```
   NEXT_PUBLIC_API_URL = https://handsome-radiance-production.up.railway.app/api
   ```
   (Change from `handsome-radiance.railway.internal` to the public URL with `/api`)

3. **Update this one:**
   ```
   NEXT_PUBLIC_EXTERNAL_API_URL = https://handsome-radiance-production.up.railway.app
   ```
   (Change from `handsome-radiance.railway.internal` to the public URL)

## Why Internal URLs Don't Work

- `*.railway.internal` URLs only work **within the Railway network** (service-to-service)
- **Browsers cannot access** internal Railway URLs
- You need to use the **public domain**: `https://handsome-radiance-production.up.railway.app`

## Steps to Fix

1. Go to Railway Dashboard → **frontend** service → **Variables** tab
2. Click the **three dots (⋯)** next to `NEXT_PUBLIC_API_URL`
3. Click **Edit**
4. Change the value from `handsome-radiance.railway.internal` to:
   ```
   https://handsome-radiance-production.up.railway.app/api
   ```
5. Click **Save**
6. Repeat for `NEXT_PUBLIC_EXTERNAL_API_URL`:
   - Change from `handsome-radiance.railway.internal` to:
   ```
   https://handsome-radiance-production.up.railway.app
   ```
7. **Redeploy** your frontend service (Railway will auto-redeploy, or you can trigger it manually)

## Final Configuration Summary

After the fix, your frontend variables should be:

```
NEXT_PUBLIC_API_BASE_URL = https://handsome-radiance-production.up.railway.app
NEXT_PUBLIC_API_URL = https://handsome-radiance-production.up.railway.app/api
NEXT_PUBLIC_EXTERNAL_API_URL = https://handsome-radiance-production.up.railway.app
```

All three should point to the **public Railway URL**, not internal URLs.

## Verification

After updating and redeploying:

1. Open your frontend in a browser
2. Open browser DevTools → Console
3. You should see API calls going to `https://handsome-radiance-production.up.railway.app/api`
4. No more `localhost:3001` errors!

