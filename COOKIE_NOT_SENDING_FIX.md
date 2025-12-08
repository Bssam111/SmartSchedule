# Cookie Not Sending - Complete Fix Guide

## Problem

Cookies are not being sent from frontend to backend. Backend logs show:
```
cookieAccessToken: 'Missing'
cookieRefreshToken: 'Missing'
allCookies: []
cookieCount: 0
```

## Root Cause Analysis

When cookies are completely missing (not just expired), it means one of these issues:

1. **Cookies were never set** - Login response didn't set cookies
2. **Cookies were set but rejected by browser** - SameSite/Secure mismatch
3. **Cookies were set but for wrong domain** - Domain mismatch
4. **CORS blocking Set-Cookie header** - CORS not configured correctly

## Critical Cookie Requirements

When using `sameSite: 'none'` (required for cross-origin requests):
- ✅ `secure: true` MUST be set (browser requirement)
- ✅ `sameSite: 'none'` must be set
- ✅ CORS must allow credentials
- ✅ Frontend must send `credentials: 'include'`

## Step-by-Step Fix

### 1. Verify Backend Environment Variables

In Railway backend service, ensure these are set:

```bash
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
ALLOWED_ORIGINS=https://smartschedule24.com
```

**CRITICAL**: `SESSION_COOKIE_SECURE` must be `true` when `SESSION_COOKIE_SAMESITE=none`

### 2. Verify Frontend Environment Variables

In Railway frontend service, ensure:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.up.railway.app/api
```

**OR** (legacy):
```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app/api
```

### 3. Check CORS Configuration

Verify `ALLOWED_ORIGINS` includes your exact frontend domain:
- ✅ `https://smartschedule24.com` (with https)
- ❌ `http://smartschedule24.com` (wrong protocol)
- ❌ `smartschedule24.com` (missing protocol)

### 4. Test Cookie Setting

After login, check browser DevTools:

1. **Application → Cookies**
   - Look for `accessToken` and `refreshToken` cookies
   - Check their attributes:
     - `Secure` ✅ (must be checked)
     - `HttpOnly` ✅ (should be checked)
     - `SameSite` = `None` ✅
     - `Domain` = (should match backend domain or be unset)

2. **Network → Login Request**
   - Check Response Headers for `Set-Cookie`
   - Should see:
     ```
     Set-Cookie: accessToken=...; Path=/; Secure; HttpOnly; SameSite=None
     Set-Cookie: refreshToken=...; Path=/; Secure; HttpOnly; SameSite=None
     ```

### 5. Verify Cookie Domain

**If frontend and backend are on different domains:**
- Cookies MUST have `sameSite: 'none'` and `secure: true`
- Domain should NOT be set (let browser handle it)
- OR set domain to shared parent domain (e.g., `.railway.app`)

**If frontend and backend are on same domain:**
- Use `sameSite: 'lax'` (simpler and more secure)
- `secure: true` still recommended for HTTPS

## Debugging Steps

### Step 1: Check Backend Logs After Login

After successful login, backend should log:
```
[Auth] ✅ Cookies set: { secure: true, sameSite: 'none', ... }
```

If you don't see this, cookies aren't being set.

### Step 2: Check Browser Console

After login, check browser console for:
- Any CORS errors
- Any cookie warnings
- Network tab showing Set-Cookie headers

### Step 3: Manual Cookie Test

1. Log in successfully
2. Open DevTools → Application → Cookies
3. Check if cookies exist
4. If they exist, check their attributes
5. Make a test API call and check Network tab → Request Headers → Cookie

### Step 4: Verify Request Headers

In Network tab, check the request to `/api/access-requests`:
- Should have `Cookie: accessToken=...; refreshToken=...`
- Should have `credentials: include` in fetch options

## Common Issues and Solutions

### Issue 1: Cookies Not Being Set

**Symptoms**: No cookies in Application tab after login

**Causes**:
- CORS blocking Set-Cookie header
- Backend not setting cookies
- Browser blocking third-party cookies

**Solutions**:
1. Verify `ALLOWED_ORIGINS` includes frontend domain
2. Check backend logs for cookie setting
3. Disable browser extensions that block cookies
4. Check browser privacy settings

### Issue 2: Cookies Set But Not Sent

**Symptoms**: Cookies exist in Application tab but not in request headers

**Causes**:
- Domain mismatch
- Path mismatch
- SameSite policy blocking

**Solutions**:
1. Verify cookie domain matches request domain
2. Check cookie path is `/`
3. Ensure `sameSite: 'none'` with `secure: true`

### Issue 3: Secure Flag Missing

**Symptoms**: Cookies set but browser rejects them

**Causes**:
- `sameSite: 'none'` without `secure: true`

**Solutions**:
1. Set `SESSION_COOKIE_SECURE=true` in backend
2. Ensure backend is using HTTPS

### Issue 4: CORS Blocking

**Symptoms**: Login succeeds but cookies not set, CORS errors in console

**Causes**:
- `ALLOWED_ORIGINS` doesn't include frontend domain
- CORS not allowing credentials

**Solutions**:
1. Add frontend domain to `ALLOWED_ORIGINS`
2. Verify `Access-Control-Allow-Credentials: true` in response headers

## Railway-Specific Configuration

### Backend Service Variables

```bash
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
ALLOWED_ORIGINS=https://smartschedule24.com
# Optional: Only if frontend/backend on different subdomains
# SESSION_COOKIE_DOMAIN=.railway.app
```

### Frontend Service Variables

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.up.railway.app/api
```

## Testing Checklist

- [ ] Backend `NODE_ENV=production`
- [ ] Backend `SESSION_COOKIE_SECURE=true`
- [ ] Backend `SESSION_COOKIE_SAMESITE=none`
- [ ] Backend `ALLOWED_ORIGINS` includes frontend domain
- [ ] Frontend `NEXT_PUBLIC_API_BASE_URL` points to backend
- [ ] Login request includes `credentials: 'include'`
- [ ] Login response includes `Set-Cookie` headers
- [ ] Cookies appear in Application → Cookies after login
- [ ] Cookies have `Secure` and `SameSite=None` attributes
- [ ] API requests include `Cookie` header
- [ ] No CORS errors in browser console

## Quick Test Script

After deploying, test with this in browser console:

```javascript
// Test 1: Check if cookies are set
console.log('Cookies:', document.cookie)

// Test 2: Make a test API call
fetch('https://your-backend.up.railway.app/api/users', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err))
```

## Still Not Working?

1. **Check Railway Logs**: Look for cookie setting logs
2. **Check Browser Console**: Look for CORS/cookie errors
3. **Check Network Tab**: Verify Set-Cookie headers in login response
4. **Try Different Browser**: Rule out browser-specific issues
5. **Check Browser Privacy Settings**: Some browsers block third-party cookies

## Code Changes Made

The code has been updated to:
1. Force `secure: true` when `sameSite: 'none'` is detected
2. Add comprehensive logging for cookie setting
3. Ensure all admin pages use centralized API utility
4. Add better error messages for debugging

After deploying these changes and setting the correct environment variables, cookies should work correctly.

