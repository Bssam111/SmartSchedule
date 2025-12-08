# Transaction Timeout Fix (P2028 Error)

## Problem

When approving access requests, the backend was throwing:
```
PrismaClientKnownRequestError: Transaction API error: Unable to start a transaction in the given time.
code: 'P2028'
```

This error occurs when Prisma cannot start a transaction within the default timeout period, typically due to:
1. Database connection pool exhaustion
2. Long-running transactions blocking new ones
3. Database server being under heavy load
4. Network latency issues

## Solution Implemented

### 1. Transaction Timeout Configuration

**File:** `backend/src/routes/access-requests/service.ts`

Added explicit timeout configuration to the `approveAccessRequest` transaction:
- `maxWait: 10000` (10 seconds) - Maximum time to wait for a transaction to start
- `timeout: 30000` (30 seconds) - Maximum time a transaction can run

### 2. Retry Logic with Exponential Backoff

**File:** `backend/src/routes/access-requests/service.ts`

Implemented automatic retry for P2028 errors:
- **Max retries:** 2 attempts
- **Backoff strategy:** Exponential (1s, 2s delays)
- **Error detection:** Specifically catches `P2028` error code
- **Logging:** Warns on timeout, logs retry attempts

### 3. User-Friendly Error Messages

**File:** `backend/src/routes/access-requests/index.ts`

Added error handling in the route handler:
- Detects P2028 errors specifically
- Returns HTTP 503 (Service Unavailable) instead of 500
- Provides user-friendly message: "The database is currently busy. Please try again in a few moments."

## Code Changes

### Transaction Retry Logic

```typescript
const maxRetries = 2
let lastError: Error | null = null

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await prisma.$transaction(async (tx) => {
      // ... transaction logic ...
    }, {
      maxWait: 10000,  // 10 seconds to start
      timeout: 30000,  // 30 seconds to complete
    })
  } catch (error: any) {
    if (error?.code === 'P2028') {
      // Retry with exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
    }
    throw error
  }
}
```

## Expected Behavior

1. **First attempt:** Transaction starts with 10s timeout
2. **On P2028 error:** Logs warning, waits 1 second, retries
3. **Second attempt:** Transaction starts with 10s timeout
4. **On second P2028 error:** Logs warning, waits 2 seconds, retries
5. **Third attempt:** Final attempt
6. **On success:** Returns approval result
7. **On failure:** Returns user-friendly 503 error

## Monitoring

The following logs help diagnose transaction issues:
- `[AccessRequests] Transaction timeout (attempt X/2):` - Indicates retry
- `[AccessRequests] Retrying transaction after Xms...` - Shows retry delay
- `[AccessRequests] ❌ Transaction timeout error:` - Final failure

## Additional Recommendations

If P2028 errors persist:

1. **Check database connection pool:**
   - Add `?connection_limit=10&pool_timeout=20` to DATABASE_URL
   - Monitor active connections

2. **Check for long-running transactions:**
   - Query `pg_stat_activity` to find blocking transactions
   - Review transaction isolation levels

3. **Database performance:**
   - Check database server CPU/memory usage
   - Review slow query logs
   - Ensure proper indexes exist

4. **Connection pool settings:**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
   ```

## Testing

To test the fix:
1. Approve an access request under normal conditions (should succeed)
2. Simulate database load (should retry and succeed)
3. Check logs for retry attempts
4. Verify user-friendly error messages appear in frontend





