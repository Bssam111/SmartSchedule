# Cookie Authentication Fix for Production

## Problem

The `/admin/users` page (and potentially other authenticated pages) was returning 401 errors because authentication cookies were not being sent with requests. The logs showed:

```
cookieAccessToken: 'Missing'
cookieRefreshToken: 'Missing'
allCookies: []
cookieCount: 0
```

## Root Causes

1. **Admin users page using hardcoded API URL**: The page was using `process.env.NEXT_PUBLIC_API_URL` directly instead of the centralized API utility that handles Railway URLs correctly.

2. **Cookie domain configuration**: Cookies may need explicit domain configuration for cross-domain scenarios in production.

3. **SameSite and Secure flags**: When `sameSite: 'none'` is used (required for cross-origin requests), cookies MUST have `secure: true`, which is already configured, but domain may need to be set.

## Fixes Applied

### 1. Updated Admin Users Page (`smart-schedule/app/admin/users/page.tsx`)

Changed all API calls to use the centralized `getApiBaseUrl()` function instead of hardcoded `process.env.NEXT_PUBLIC_API_URL`:

```typescript
// Before
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// After
const { getApiBaseUrl } = await import('@/lib/api-utils')
const API_BASE_URL = getApiBaseUrl()
```

This ensures:
- Railway internal URLs are correctly converted to public URLs
- Environment variables are properly handled
- Consistent API URL resolution across the application

### 2. Enhanced Cookie Configuration (`backend/src/utils/jwt.ts`)

Added support for cookie domain configuration:

```typescript
// Get domain from environment variable if set (for cross-domain cookies in production)
const domain = process.env.SESSION_COOKIE_DOMAIN || undefined

// Only set domain if explicitly configured
if (domain) {
  cookieOptions.domain = domain
}
```

Also updated `clearTokenCookies` to respect domain configuration when clearing cookies.

## Railway Environment Variables

To fix cookie authentication in production, ensure these environment variables are set in Railway:

### Backend Service

1. **`ALLOWED_ORIGINS`**: Must include your frontend domain
   ```
   ALLOWED_ORIGINS=https://smartschedule24.com,https://www.smartschedule24.com
   ```

2. **`SESSION_COOKIE_SECURE`**: Should be `true` in production
   ```
   SESSION_COOKIE_SECURE=true
   ```

3. **`SESSION_COOKIE_SAMESITE`**: Should be `none` for cross-origin requests
   ```
   SESSION_COOKIE_SAMESITE=none
   ```

4. **`SESSION_COOKIE_DOMAIN`** (Optional): Only set if you need cross-subdomain cookies
   ```
   SESSION_COOKIE_DOMAIN=.smartschedule24.com
   ```
   ⚠️ **Warning**: Only set this if your frontend and backend are on different subdomains. If they're on the same domain, leave this unset.

### Frontend Service

1. **`NEXT_PUBLIC_API_BASE_URL`**: Should point to your Railway backend public URL
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.up.railway.app/api
   ```

   OR use the legacy variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app/api
   ```

## Verification Steps

1. **Check CORS Configuration**:
   - Verify `ALLOWED_ORIGINS` includes your frontend domain
   - Check backend logs for CORS errors

2. **Check Cookie Settings**:
   - Open browser DevTools → Application → Cookies
   - Verify cookies are being set after login
   - Check that cookies have:
     - `Secure` flag (if using HTTPS)
     - `SameSite=None` (for cross-origin)
     - `HttpOnly` flag (for security)
     - Correct `Domain` (if set)

3. **Test Authentication Flow**:
   - Log in to the application
   - Navigate to `/admin/users`
   - Check browser Network tab to verify cookies are sent with requests
   - Check backend logs for authentication success

## Common Issues

### Issue: Cookies not being set

**Possible causes:**
- `SESSION_COOKIE_SECURE=true` but site is using HTTP (should use HTTPS)
- `SESSION_COOKIE_SAMESITE=none` but `secure=false` (must be `secure=true`)
- Domain mismatch between frontend and backend

**Solution:**
- Ensure HTTPS is enabled
- Set `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAMESITE=none`
- Verify `ALLOWED_ORIGINS` includes your frontend domain

### Issue: Cookies set but not sent

**Possible causes:**
- CORS not allowing credentials
- Domain mismatch
- SameSite policy blocking cross-origin cookies

**Solution:**
- Verify `Access-Control-Allow-Credentials: true` in CORS headers
- Check that frontend requests include `credentials: 'include'`
- Ensure `ALLOWED_ORIGINS` matches the request origin exactly

### Issue: 401 errors after login

**Possible causes:**
- Token expired
- Cookies cleared by browser
- Domain/path mismatch

**Solution:**
- Check cookie expiration settings
- Verify cookies are not being cleared by browser privacy settings
- Ensure cookie `path` is `/` and domain matches

## Testing

After applying fixes:

1. Clear browser cookies and local storage
2. Log in fresh
3. Navigate to `/admin/users`
4. Verify no 401 errors in console
5. Check backend logs for successful authentication

## Additional Notes

- The centralized API utility (`lib/api-utils.ts`) handles Railway URL conversion automatically
- All API calls should use `credentials: 'include'` to send cookies
- The authentication middleware automatically refreshes tokens when they expire
- Check browser console and network tab for detailed error messages

