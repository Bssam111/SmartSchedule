# Session Expiration Diagnostics Guide

## Logging Added

Comprehensive logging has been added to help diagnose the "Your session has expired" error on committee actions.

## What to Look For in Backend Logs

### 1. When Approve Action is Triggered

Look for this sequence in backend logs:

```
[AUTH] 🔍 Request received: { method: 'POST', originalUrl: '/api/access-requests/:id/approve', ... }
```

This shows:
- Request method and URL
- Whether Authorization header is present
- Whether cookies (accessToken, refreshToken) are present
- All cookie keys

### 2. Token Verification

**Success case:**
```
[AUTH] ✅ Token verified successfully: { userId: '...', email: '...', role: 'COMMITTEE', tokenSource: 'cookie' }
```

**Failure case - No token:**
```
[AUTH] ❌ Session expired - No token found: { reason: 'accessTokenMissing', ... }
```

**Failure case - Token expired:**
```
[AUTH] ⚠️ Token verification failed: { errorType: 'CustomError', errorMessage: 'Invalid or expired token' }
```

### 3. Token Refresh Attempt

**Refresh token missing:**
```
[AUTH] ❌ Session expired - No refresh token available: { reason: 'refreshTokenMissing', ... }
```

**Refresh token invalid:**
```
[AUTH] ❌ Session expired - Refresh token failed: { reason: 'refreshTokenInvalid', refreshError: '...' }
```

**Refresh success:**
```
[AUTH] ✅ Token refreshed successfully: { userId: '...', email: '...', role: 'COMMITTEE', newTokensGenerated: true }
```

### 4. Role Check (requireCommittee)

**Success:**
```
[AUTH] ✅ requireCommittee passed: { userId: '...', userRole: 'COMMITTEE' }
```

**Failure - No user:**
```
[AUTH] ❌ requireCommittee failed - No user in request: { hasUser: false }
```

**Failure - Wrong role:**
```
[AUTH] ❌ requireCommittee failed - Role mismatch: { 
  expectedRole: 'COMMITTEE', 
  actualRole: '...', 
  roleComparison: 'mismatch' 
}
```

### 5. Final 401 Response

```
[AUTH] ❌ Session expired - Returning 401: { 
  method: 'POST', 
  originalUrl: '/api/access-requests/:id/approve', 
  reason: 'tokenExpired' | 'refreshTokenMissing' | 'refreshTokenInvalid' | 'accessTokenMissing',
  errorMessage: '...'
}
```

## Common Issues and What Logs Show

### Issue 1: Cookies Not Sent
**Logs show:**
- `cookieAccessToken: 'Missing'`
- `cookieRefreshToken: 'Missing'`
- `cookieCount: 0`
- `reason: 'accessTokenMissing'`

**Fix:** Check frontend is using `credentials: 'include'` in fetch/axios

### Issue 2: Token Expired, Refresh Token Missing
**Logs show:**
- `cookieAccessToken: 'Present'` (but expired)
- `cookieRefreshToken: 'Missing'`
- `reason: 'refreshTokenMissing'`

**Fix:** Check cookie settings (sameSite, secure, httpOnly)

### Issue 3: Refresh Token Invalid
**Logs show:**
- `reason: 'refreshTokenInvalid'`
- `refreshError: 'Invalid or expired token'`

**Fix:** Refresh token may have expired or been invalidated

### Issue 4: Role Mismatch
**Logs show:**
- `reason: 'roleMismatch'` (in requireCommittee)
- `actualRole: 'STUDENT'` (or other, not 'COMMITTEE')

**Fix:** User role in database doesn't match expected 'COMMITTEE'

### Issue 5: Token Refresh Success But Still Fails
**Logs show:**
- `[AUTH] ✅ Token refreshed successfully`
- But then still returns 401

**Fix:** Check if `X-New-Access-Token` header is being read by frontend

## Reproducing the Error

1. **Start backend with logs visible:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend-dev
   ```

2. **Clear browser state:**
   - Clear cookies for localhost
   - Clear localStorage
   - Hard refresh (Ctrl+F5)

3. **Login as committee member**

4. **Navigate to Access Requests page**

5. **Click Approve on a request**

6. **Watch backend logs for the sequence above**

## Expected Log Sequence for Working Approve

```
[AUTH] 🔍 Request received: { method: 'POST', originalUrl: '/api/access-requests/xxx/approve', cookieAccessToken: 'Present', ... }
[AUTH] ✅ Token verified successfully: { userId: '...', role: 'COMMITTEE', tokenSource: 'cookie' }
[AUTH] ✅ requireCommittee passed: { userRole: 'COMMITTEE' }
[AccessRequests] POST /:id/approve - Received approval request: { userId: '...', role: 'COMMITTEE' }
[AccessRequests] ✅ Request approved successfully
```

## Expected Log Sequence for Failed Approve

```
[AUTH] 🔍 Request received: { method: 'POST', originalUrl: '/api/access-requests/xxx/approve', cookieAccessToken: 'Missing', ... }
[AUTH] ❌ Session expired - No token found: { reason: 'accessTokenMissing', ... }
[AUTH] ❌ Session expired - Returning 401: { reason: 'accessTokenMissing', ... }
```

## Key Diagnostic Points

1. **Check cookie presence** - Are cookies being sent?
2. **Check token source** - Is it from cookie or header?
3. **Check refresh attempt** - Does it try to refresh?
4. **Check refresh success** - Does refresh succeed?
5. **Check role** - Is role exactly 'COMMITTEE'?
6. **Check middleware order** - cookieParser must be before routes

## Middleware Order Verification

In `backend/src/server.ts`, the order should be:
1. CORS middleware
2. Security headers
3. Body parsers (JSON, URL encoded)
4. **cookieParser()** ← Must be here
5. Routes (which use authenticateToken)
6. Error handler (last)

This order is **correct** in the current code.

