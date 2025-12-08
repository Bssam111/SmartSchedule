# Fix: Majors Not Loading in /register

## Issue
Majors exist in the database but are not being fetched/displayed in the `/register` page.

## Root Cause
The backend server needs to be restarted to pick up the new Prisma Client that includes the `Major` model.

## Solution

### Step 1: Restart Backend Server
The backend server must be restarted after:
- Running `npx prisma generate` (already done)
- Database migration (already applied)
- Seeding majors (already done)

**If using Docker:**
```bash
docker-compose restart backend
# OR
docker-compose down && docker-compose up -d
```

**If running locally:**
```bash
# Stop the backend server (Ctrl+C)
# Then restart it:
cd backend
npm run dev
```

### Step 2: Verify Backend is Running
Check that the backend is accessible:
```bash
curl http://localhost:3001/api/majors
```

Should return:
```json
{"success":true,"data":[{"id":"...","name":"Software Engineering"},{"id":"...","name":"Computer Science"}]}
```

### Step 3: Check Browser Console
Open the browser console (F12) on `/register` page and look for:
- "Loading majors..." log
- "Majors API response:" log
- Any error messages

### Step 4: Verify Database Connection
The backend might be connecting to a different database. Check:
- `backend/.env` file has correct `DATABASE_URL`
- The database URL matches where majors were seeded

## Debugging

### Check if Majors Exist
```bash
cd backend
npx tsx -r tsconfig-paths/register src/scripts/check-majors.ts
```

### Test API Endpoint Directly
```bash
curl http://localhost:3001/api/majors
```

### Check Backend Logs
Look for:
- `[Majors] Fetching majors from database...`
- `[Majors] Found X majors: ...`

## Expected Behavior After Fix

1. Visit `/register` page
2. Major dropdown should show:
   - "Select a major" (placeholder)
   - "Software Engineering"
   - "Computer Science"
3. Console should show:
   - "Loading majors..."
   - "Majors API response: {success: true, data: [...]}"
   - "Setting majors: [...]"

## Files Modified

- `backend/src/routes/majors/index.ts` - Added logging
- `smart-schedule/app/register/page.tsx` - Added better error handling and fallback options

