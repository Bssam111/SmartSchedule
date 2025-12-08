# API 404 Error Fix

## Problem
The login page was showing a 404 error when trying to authenticate. The error message was:
```
Server returned 404. Check if backend is running and API URL is correct.
```

The console showed:
- `Failed to load resource: the server responded with a status of 404 () api/auth/login:1`
- `Non-JSON response received: <!DOCTYPE html>...` (HTML instead of JSON)

## Root Cause
1. **Double `/api` in URL construction**: The `api.ts` file had endpoints starting with `/api/` (e.g., `/api/auth/login`), but `API_BASE_URL` already included `/api` (e.g., `https://smartschedule24.com/api`), resulting in URLs like `https://smartschedule24.com/api/api/auth/login`.

2. **Production URL configuration**: In production, the frontend was trying to use absolute URLs that might not be correctly configured, or the requests weren't being proxied correctly by nginx.

## Solution
1. **Fixed double `/api` issue**: Removed `/api` prefix from all endpoints in `api.ts` since `API_BASE_URL` already includes it.

2. **Created shared utility function**: Created `lib/api-utils.ts` with a `getApiBaseUrl()` function that:
   - Uses relative URLs (`/api`) in production (so nginx can proxy them correctly)
   - Uses absolute URLs (`http://localhost:3001/api`) in development
   - Detects production by checking if hostname is not `localhost` or `127.0.0.1`

3. **Updated all API calls**: Updated the following files to use the new utility:
   - `lib/api.ts` - Fixed endpoints and made baseURL dynamic via getter
   - `components/AuthProvider.tsx` - Updated login function
   - `lib/webauthn.ts` - Updated all WebAuthn API calls

## Files Changed
- ✅ `smart-schedule/lib/api-utils.ts` (new file)
- ✅ `smart-schedule/lib/api.ts`
- ✅ `smart-schedule/components/AuthProvider.tsx`
- ✅ `smart-schedule/lib/webauthn.ts`

## How It Works Now

### Development (localhost)
- API calls use: `http://localhost:3001/api/auth/login`
- Direct connection to backend

### Production (smartschedule24.com)
- API calls use: `/api/auth/login` (relative URL)
- Nginx proxies `/api/*` requests to the backend service
- This ensures requests always go through nginx, which handles SSL, CORS, and routing

## Testing
1. **Development**: 
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd smart-schedule && npm run dev`
   - Login should work at `http://localhost:3000/login`

2. **Production**:
   - Deploy to Railway or your production environment
   - Ensure nginx is configured to proxy `/api/*` to backend
   - Login should work at `https://smartschedule24.com/login`

## Additional Notes
- The fix uses relative URLs in production, which is the recommended approach for Next.js apps behind a reverse proxy
- No environment variable changes are required - the code automatically detects the environment
- If you still want to use `NEXT_PUBLIC_API_URL` in production, you can set it, but it's not required anymore

## Next Steps (Optional)
If you have other files that directly use `NEXT_PUBLIC_API_URL` with fetch calls, consider updating them to use `getApiBaseUrl()` from `lib/api-utils.ts` for consistency. Files that may need updating:
- `app/committee/schedules/page.tsx`
- `app/student/dashboard/page.tsx`
- `app/faculty/dashboard/page.tsx`
- Other pages that make direct API calls


