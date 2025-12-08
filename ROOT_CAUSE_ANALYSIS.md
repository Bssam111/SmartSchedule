# Root Cause Analysis: "Reviewer identity missing" Error

## Problem Summary

The backend logs showed:
- ✅ Authentication succeeded (`authenticateToken` passed)
- ✅ RBAC succeeded (`requireCommittee` passed)
- ❌ Route handler received `req.user?.id` as `undefined`
- ❌ Backend threw "Reviewer identity missing" with 401 status
- ❌ Frontend incorrectly interpreted this as "Your session has expired"

## Root Cause Identified

### Primary Issue: Token Payload vs Route Expectation Mismatch

The `authenticateToken` middleware was setting `req.user` directly from the decoded JWT token payload, which uses `userId` as the field name:

```typescript
// Token payload structure
{
  userId: string,  // ← Token uses 'userId'
  email: string,
  role: string
}

// But routes expect:
req.user.id  // ← Routes expect 'id', not 'userId'
```

When the middleware set `req.user = decoded as any`, it preserved the token's structure (`userId`), but routes were checking `req.user?.id`, which was `undefined`.

### Secondary Issue: Incorrect HTTP Status Code

The "Reviewer identity missing" error was returning **401 (Unauthorized)**, which indicates an authentication failure. However, authentication had already succeeded - this was actually a **server error (500)** indicating a middleware bug where the user ID wasn't properly mapped.

## Solution Implemented

### 1. Auth Middleware Fix (`backend/src/middleware/auth.ts`)

**Changed:** Map `userId` to `id` when setting `req.user`:

```typescript
// BEFORE (incorrect)
req.user = decoded as any  // Preserves token structure with 'userId'

// AFTER (correct)
req.user = {
  id: decoded.userId,      // Map userId → id
  email: decoded.email,
  role: decoded.role
}
```

This ensures `req.user.id` is always available to route handlers.

### 2. Route Handler Defensive Check (`backend/src/routes/access-requests/index.ts`)

**Added:** Fallback to `req.userId` if `req.user.id` is missing:

```typescript
// Use req.userId as fallback if req.user.id is missing (defensive check)
const reviewerId = req.user?.id || req.userId
if (!reviewerId) {
  // Return 500 (server error), not 401 (auth error)
  throw new CustomError('Reviewer identity missing', 500)
}
```

**Applied to all committee routes:**
- `POST /:id/approve`
- `POST /:id/reject`
- `POST /:id/lock`

### 3. Error Status Code Correction

**Changed:** "Reviewer identity missing" now returns **500** instead of **401**:

- **401** = Authentication failed (user not authenticated)
- **500** = Server error (auth succeeded but middleware bug)

This prevents frontend from showing "session expired" for server errors.

### 4. Frontend Error Handling (`smart-schedule/app/committee/access-requests/page.tsx`)

**Updated:** Distinguish between authentication errors and server errors:

```typescript
// Only treat true auth errors as session expiration
if ((errorMsg.includes('Authentication required') || errorMsg.includes('session expired')) && 
    !errorMsg.includes('Reviewer identity missing')) {
  // Show session expired message
} else {
  // Show actual error message
}
```

## Verification Points

### Middleware Order (Verified Correct)
1. CORS middleware
2. Security headers
3. Body parsers (JSON, URL encoded)
4. **cookieParser()** ← Must be before routes
5. Routes (which use `authenticateToken`)
6. Error handler (last)

### Token Refresh Path (Already Correct)
The token refresh path in `authenticateToken` was already correctly mapping `userId` to `id`:

```typescript
req.user = {
  id: user.id,        // ✅ Already correct
  email: user.email,
  role: user.role
}
```

The issue was only in the normal token verification path.

## Expected Behavior After Fix

1. **Authentication succeeds** → `req.user.id` is set correctly
2. **RBAC succeeds** → `requireCommittee` passes
3. **Route handler receives** → `req.user.id` is available
4. **Approval succeeds** → No "Reviewer identity missing" error
5. **If error occurs** → Returns 500 (server error), not 401 (auth error)
6. **Frontend shows** → Appropriate error message, not "session expired"

## Testing Checklist

- [ ] Committee member can approve access requests
- [ ] `req.user.id` is logged correctly in route handler
- [ ] No "Reviewer identity missing" errors occur
- [ ] If error occurs, frontend shows correct message (not "session expired")
- [ ] Token refresh still works correctly
- [ ] All committee routes (approve, reject, lock) work correctly
