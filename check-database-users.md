# Check Database Users

## Problem
All login attempts are failing with "Invalid credentials". This could mean:
1. Users don't exist in the database
2. Password hashes are incorrect
3. Database connection issue

## Solution: Check Database

### Option 1: Using Railway Dashboard
1. Go to Railway → **Postgres** service
2. Click **Connect** or use **Query** tab
3. Run this query:

```sql
SELECT id, email, name, role, 
       LEFT(password, 30) as password_hash_preview,
       "createdAt"
FROM users 
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Option 2: Using psql (if you have connection string)
```bash
psql $DATABASE_URL -c "SELECT email, name, role FROM users;"
```

### Option 3: Insert Test Users
If users don't exist, run the seed script:

```sql
-- From insert_test_users.sql or seed_complete_database.sql
-- This will insert users with password: password123
```

## Verify Password Hash

The password hash in the SQL files is:
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

This should match password: `password123`

Run `node verify-password-hash.js` to verify.

## Expected Users

From `seed_complete_database.sql`:
- `dr.ahmed@ksu.edu.sa` / `password123` (FACULTY)
- `student@example.com` / `password123` (STUDENT)
- `faculty@example.com` / `password123` (FACULTY)
- `committee@ksu.edu.sa` / `password123` (COMMITTEE)

## Next Steps

1. **Check if users exist** - Run SQL query above
2. **If users don't exist** - Run seed script
3. **If users exist but login fails** - Check password hash format
4. **Check backend logs** - Railway → backend → Logs to see detailed error

