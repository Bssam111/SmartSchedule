# Login Credentials Fix

## Problem
Even with correct credentials, login shows "Invalid credentials" error. Console shows requests going to wrong domain: `handsome-radiance-pr.pp` instead of `handsome-radiance-production.up.railway.app`.

## Root Cause
The `NEXT_PUBLIC_API_URL` environment variable was either:
1. Not set correctly in Railway
2. Truncated/corrupted during build
3. Set to wrong value

This caused requests to go to the wrong backend, resulting in 401 errors.

## Fix Applied

### 1. Force Correct Backend URL
Updated `api-utils.ts` to **always** use the correct Railway backend URL in production:
```typescript
const CORRECT_BACKEND_URL = 'https://handsome-radiance-production.up.railway.app/api'
```

This overrides any potentially corrupted `NEXT_PUBLIC_API_URL` value.

### 2. Improved Error Logging
Added detailed console logging in `AuthProvider.tsx` to help debug:
- Shows the exact API URL being used
- Logs response status and data
- Shows detailed error messages from backend

## Next Steps

### Step 1: Wait for Deployment
Railway is automatically deploying the fix (2-5 minutes).

### Step 2: Test Login
After deployment completes:
1. Open `https://smartschedule24.com/login`
2. Open browser DevTools → Console
3. You should see: `[API] Using Railway backend URL: https://handsome-radiance-production.up.railway.app/api`
4. Try to login
5. Check console for detailed logs

### Step 3: Verify User Exists in Database
The "Invalid credentials" error could also mean:
- User doesn't exist in database
- Password is incorrect
- Email format doesn't match

**Check Database:**
1. Connect to Railway Postgres database
2. Run: `SELECT email, name, role FROM users;`
3. Verify your test user exists

**Test Users from `insert_test_users.sql`:**
- `student@example.com` / `password123`
- `faculty@example.com` / `password123`
- `committee@example.com` / `password123`

Or check `seed_complete_database.sql` for more users.

### Step 4: Verify Backend Logs
Check Railway backend logs to see if requests are arriving:
1. Railway → **backend** service → **Logs**
2. Look for: `🔍 ==> Login endpoint hit!`
3. Check the request body and any errors

### Step 5: Check CORS
Verify backend allows requests from frontend:
1. Railway → **backend** service → **Variables**
2. Ensure `FRONTEND_URL` is set to: `https://smartschedule24.com`
3. If not set, add it (backend will restart)

## Expected Behavior After Fix

✅ Requests go to: `https://handsome-radiance-production.up.railway.app/api/auth/login`
✅ Console shows detailed login logs
✅ Either successful login OR clear error message from backend
✅ No more requests to `handsome-radiance-pr.pp`

## If Still Getting "Invalid Credentials"

### Check 1: User Exists
- Verify user email exists in database
- Check email format matches exactly (case-sensitive)

### Check 2: Password Hash
- Passwords are hashed with bcrypt
- If you created user manually, ensure password was hashed correctly
- Use the test users from SQL files (passwords are already hashed)

### Check 3: Backend Logs
- Check Railway backend logs for actual error
- Look for database connection issues
- Verify Prisma client is working

### Check 4: Network Tab
- Open DevTools → Network
- Find the `/auth/login` request
- Check:
  - Request URL (should be correct Railway URL)
  - Request payload (email and password)
  - Response status (401 = credentials wrong, 500 = server error)
  - Response body (should show error message)

## Files Changed
- ✅ `smart-schedule/lib/api-utils.ts` - Force correct backend URL
- ✅ `smart-schedule/components/AuthProvider.tsx` - Improved error logging
- ✅ Pushed to GitHub - Railway auto-deploying

## Testing Checklist

After deployment:
- [ ] Console shows correct API URL
- [ ] Network tab shows requests to correct domain
- [ ] Backend logs show login attempts
- [ ] Either login succeeds OR shows clear error message
- [ ] No more 404 or wrong domain errors


