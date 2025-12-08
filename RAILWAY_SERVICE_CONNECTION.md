# Railway Service Connection - Frontend to Backend

## Current Issue

The Railway architecture diagram shows **NO arrow** from frontend (SmartSchedule) to backend (handsome-radiance). This is **CORRECT** - Railway's architecture view only shows:
- ✅ Database connections (Postgres, Redis)
- ✅ Volume connections
- ✅ Shared variables

**HTTP/API connections are NOT shown** because they're just HTTP requests, not infrastructure dependencies.

## The Real Problem

However, the **404 error** indicates the frontend can't reach the backend. This is because:

1. **Current code uses relative URLs** (`/api`) which assumes a reverse proxy (nginx)
2. **Railway doesn't automatically set up a reverse proxy**
3. **Each service needs its own public URL** or the frontend needs to know the backend's URL

## Solution Options

### Option 1: Use Backend's Public Railway URL (Recommended)

1. **Get Backend's Public URL:**
   - Go to Railway → **handsome-radiance** service
   - Click **Settings** → **Networking** → **Public Networking**
   - Copy the Railway subdomain (e.g., `handsome-radiance-production.up.railway.app`)
   - Or if you have a custom domain, use that

2. **Update Frontend Environment Variable:**
   - Go to Railway → **SmartSchedule** service → **Variables**
   - Set `NEXT_PUBLIC_API_URL` to: `https://handsome-radiance-production.up.railway.app/api`
   - (Replace with your actual backend URL)

3. **Update Code to Use Environment Variable:**
   - The code already uses `NEXT_PUBLIC_API_URL` when set
   - In production, it will use the env var instead of relative URL

### Option 2: Use Custom Domain for Backend

If you want both services on the same domain:
- Set up a subdomain like `api.smartschedule24.com` for the backend
- Point it to the backend service in Railway
- Update `NEXT_PUBLIC_API_URL` to `https://api.smartschedule24.com/api`

### Option 3: Use Railway Private Networking (Advanced)

Railway services can communicate via private networking using service names:
- Backend service name: `handsome-radiance`
- Frontend could use: `http://handsome-radiance:3001/api`
- But this only works for server-side requests, not browser requests

## Recommended Fix

**Use Option 1** - it's the simplest and most reliable:

1. Get backend's Railway public URL
2. Set `NEXT_PUBLIC_API_URL` in frontend service variables
3. The code will automatically use it in production

## Current Code Behavior

The `api-utils.ts` file currently:
- Uses relative URL (`/api`) in production if hostname is not localhost
- Falls back to `NEXT_PUBLIC_API_URL` if set
- Uses `http://localhost:3001/api` in development

**We need to update it** to prioritize `NEXT_PUBLIC_API_URL` in production.


