# 🚨 CRITICAL FIX: NODE_ENV Not Set in Railway

## The Problem

Your backend logs show:
```
isProduction: false,
nodeEnv: undefined,
secure: false,
sameSite: 'lax'
```

This means:
- ❌ Backend thinks it's in development mode
- ❌ Cookies are set with `SameSite=Lax` (won't work cross-site)
- ❌ Cookies are set with `secure: false` (won't work with HTTPS)
- ❌ Frontend (`smartschedule24.com`) and backend (Railway) are different domains
- ❌ Browser blocks `SameSite=Lax` cookies on cross-site requests

## The Solution

**Set `NODE_ENV=production` in Railway backend service!**

### Step-by-Step Fix

1. **Go to Railway Dashboard**
   - Select your backend service
   - Go to "Variables" tab

2. **Add/Update Environment Variable**
   ```
   NODE_ENV=production
   ```

3. **Verify Other Variables Are Set**
   ```
   NODE_ENV=production
   SESSION_COOKIE_SECURE=true
   SESSION_COOKIE_SAMESITE=none
   ALLOWED_ORIGINS=https://smartschedule24.com
   ```

4. **Redeploy Backend Service**
   - Railway will automatically redeploy when you save variables
   - Or manually trigger a redeploy

5. **Verify After Redeploy**
   - Check backend logs after login
   - Should now show:
     ```
     isProduction: true,
     nodeEnv: 'production',
     secure: true,
     sameSite: 'none'
     ```

## Why This Fixes It

When `NODE_ENV=production`:
- ✅ Backend detects production mode
- ✅ Sets `sameSite: 'none'` (allows cross-site cookies)
- ✅ Sets `secure: true` (required for `SameSite=None`)
- ✅ Cookies will be sent on cross-site requests

## Test After Fix

1. **Clear browser cookies** (important!)
2. **Log in again**
3. **Check backend logs** - should show:
   ```
   [Auth] ✅ Cookies set: {
     secure: true,
     sameSite: 'none',
     ...
   }
   ```
4. **Check browser DevTools**:
   - Application → Cookies → Should see `accessToken` and `refreshToken`
   - Network → API requests → Should see `Cookie` header

## Quick Test Script

After setting `NODE_ENV=production` and redeploying, test with:

```javascript
// In browser console after login
fetch('https://your-backend.up.railway.app/api/health/test-cookies', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('Cookies received by backend:', data.cookies);
    if (data.cookies.hasAccessToken) {
      console.log('✅ SUCCESS: Cookies are working!');
    } else {
      console.log('❌ FAILED: Cookies not received');
    }
  });
```

## Expected Logs After Fix

### Before (Current - Broken):
```
[Auth] ✅ Cookies set: {
  secure: false,
  sameSite: 'lax',
  isProduction: false,
  nodeEnv: undefined
}
```

### After (Fixed):
```
[Auth] ✅ Cookies set: {
  secure: true,
  sameSite: 'none',
  isProduction: true,
  nodeEnv: 'production'
}
```

## Additional Notes

- The code has been updated to also check for `RAILWAY_ENVIRONMENT` or `RAILWAY_SERVICE_NAME` to detect Railway
- But the most reliable way is to explicitly set `NODE_ENV=production`
- This is a **critical** fix - cookies won't work without it in production

## Still Not Working?

If cookies still don't work after setting `NODE_ENV=production`:

1. Verify `NODE_ENV=production` is actually set (check Railway logs)
2. Clear browser cookies completely
3. Try incognito mode
4. Check browser console for CORS errors
5. Verify `ALLOWED_ORIGINS` includes exact frontend domain

