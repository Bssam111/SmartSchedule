# Railway Cookie Debugging Guide

## Quick Diagnostic Steps

### Step 1: Test Cookie Endpoint

After logging in, test if cookies are being received by the backend:

```javascript
// Run this in browser console after login
fetch('https://your-backend.up.railway.app/api/health/test-cookies', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('Cookie Test:', data))
```

This will show:
- If cookies are being sent from browser
- What cookies the backend sees
- CORS configuration

### Step 2: Check Login Response

After login, check Network tab:
1. Find the `/api/auth/login` request
2. Check **Response Headers** for `Set-Cookie`
3. Should see:
   ```
   Set-Cookie: accessToken=...; Path=/; Secure; HttpOnly; SameSite=None
   Set-Cookie: refreshToken=...; Path=/; Secure; HttpOnly; SameSite=None
   ```

### Step 3: Check Backend Logs

After login, backend should log:
```
[Login] 🔐 Setting cookies for user: user@example.com
[Login] 🔐 Request origin: https://smartschedule24.com
[Login] 🔐 Set-Cookie headers: [array of cookies]
[Auth] ✅ Cookies set: { secure: true, sameSite: 'none', ... }
```

### Step 4: Verify Environment Variables

**Backend Service:**
```bash
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
ALLOWED_ORIGINS=https://smartschedule24.com
```

**Frontend Service:**
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.up.railway.app/api
```

## Common Issues

### Issue: No Set-Cookie Headers in Login Response

**Cause**: CORS blocking Set-Cookie header

**Solution**:
1. Verify `ALLOWED_ORIGINS` includes exact frontend domain
2. Check backend logs for CORS warnings
3. Ensure `Access-Control-Allow-Credentials: true` is set

### Issue: Set-Cookie Headers Present But Cookies Not Saved

**Cause**: Browser rejecting cookies due to SameSite/Secure mismatch

**Solution**:
1. Verify `SESSION_COOKIE_SECURE=true`
2. Verify `SESSION_COOKIE_SAMESITE=none`
3. Check browser console for cookie warnings
4. Try different browser (some browsers block third-party cookies)

### Issue: Cookies Saved But Not Sent

**Cause**: Domain/path mismatch or SameSite policy

**Solution**:
1. Check cookie domain in Application → Cookies
2. Verify cookie path is `/`
3. Ensure `credentials: 'include'` in all fetch calls
4. Check if frontend/backend are on different domains (requires SameSite=None)

## Browser Console Test

Run this after login to diagnose:

```javascript
// Test 1: Check if cookies exist
console.log('All cookies:', document.cookie)

// Test 2: Check localStorage
console.log('User:', localStorage.getItem('smartSchedule_user'))
console.log('Token:', localStorage.getItem('smartSchedule_token'))

// Test 3: Test cookie endpoint
fetch('https://your-backend.up.railway.app/api/health/test-cookies', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('Backend sees cookies:', data.cookies)
    console.log('CORS origin:', data.headers.origin)
  })

// Test 4: Test authenticated endpoint
fetch('https://your-backend.up.railway.app/api/users', {
  credentials: 'include'
})
  .then(r => {
    console.log('Status:', r.status)
    return r.json()
  })
  .then(data => console.log('Response:', data))
```

## Expected Backend Logs

### Successful Login:
```
[Login] 🔐 Setting cookies for user: user@example.com
[Login] 🔐 Request origin: https://smartschedule24.com
[Login] 🔐 Set-Cookie headers: [2 cookie(s)]
[Auth] ✅ Cookies set: { secure: true, sameSite: 'none', path: '/', httpOnly: true, domain: 'current domain', isProduction: true, nodeEnv: 'production' }
```

### Failed Cookie Setting:
```
[CORS] ⚠️ Origin not allowed: { origin: 'https://smartschedule24.com', ... }
```

## Railway-Specific Notes

1. **Domain Configuration**: Railway services get URLs like `*.up.railway.app`
2. **HTTPS**: All Railway services use HTTPS automatically
3. **Environment Variables**: Set in Railway dashboard → Service → Variables
4. **Redeploy**: After changing env vars, redeploy the service

## Still Not Working?

1. Check Railway backend logs for cookie setting messages
2. Check browser console for CORS errors
3. Verify exact domain in `ALLOWED_ORIGINS` (no trailing slash, exact match)
4. Try incognito mode (rules out browser extensions)
5. Check browser privacy settings (some block third-party cookies)

