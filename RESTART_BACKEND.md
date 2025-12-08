# Backend Server Must Be Restarted

## Issue
Majors exist in the database but the API returns an empty array because the **backend server is using an old Prisma Client** that doesn't include the `Major` model.

## Solution: Restart Backend Server

The backend server MUST be restarted to pick up the new Prisma Client that includes the `Major` model.

### Step 1: Stop the Backend Server

**If running in terminal:**
- Press `Ctrl+C` in the terminal where the backend is running

**If using Docker:**
```bash
docker-compose stop backend
# OR
docker-compose down
```

### Step 2: Restart the Backend Server

**If running locally:**
```bash
cd backend
npm run dev
```

**If using Docker:**
```bash
docker-compose up -d backend
# OR
docker-compose up -d
```

### Step 3: Verify It's Working

After restart, test the API:
```bash
curl http://localhost:3001/api/majors
```

Should return:
```json
{"success":true,"data":[{"id":"...","name":"Computer Science"},{"id":"...","name":"Software Engineering"}]}
```

### Step 4: Check Backend Logs

After restart, when you call `/api/majors`, you should see in the backend logs:
```
[Majors] Fetching majors from database...
[Majors] Found 2 majors: Computer Science, Software Engineering
```

If you see an error like "Major model not found" or "Unknown model", the server is still using the old Prisma Client.

## Why This Happens

1. Prisma Client is generated at build time
2. When you add a new model (Major), you need to:
   - Run `npx prisma generate` ✅ (already done)
   - **Restart the server** ❌ (this is what's missing)

3. The running server has the old Prisma Client in memory
4. The old client doesn't know about the `Major` model
5. So `prisma.major.findMany()` returns an empty array or throws an error

## Verification

The test script confirms:
- ✅ Majors exist in database (2 majors found)
- ✅ Prisma Client CAN access them when run directly
- ❌ But the running server's Prisma Client doesn't have the model

**The fix is simple: Restart the backend server!**

