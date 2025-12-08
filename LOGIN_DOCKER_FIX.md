# Login & Docker Fix - Complete Solution

## Issues Fixed

### 1. Docker Backend Startup Failure
- **Problem**: `Error: Cannot find module '/app/scripts/kill-port.js'`
- **Root Cause**: Docker was trying to run `npm run dev` which called kill-port.js
- **Solution**: 
  - Created `dev:docker` script that doesn't call kill-port
  - Updated docker-compose to use `npm run dev:docker`
  - Docker no longer references kill-port.js

### 2. "Failed to fetch" on Login
- **Problem**: Frontend couldn't connect to backend
- **Root Causes**:
  - Backend not listening on 0.0.0.0 in Docker
  - No health check before login attempt
  - API base URL configuration issues
- **Solution**:
  - Backend listens on 0.0.0.0 when `DOCKER_ENV=true`
  - Added `/healthz` endpoint (before all middleware)
  - Login checks health before attempting authentication
  - Updated API base URL to support `NEXT_PUBLIC_API_BASE_URL`

### 3. Hydration Warnings
- **Problem**: React hydration mismatches from SSR/client differences
- **Solution**: 
  - All `localStorage` access wrapped in `typeof globalThis.window !== 'undefined'`
  - Client-only code moved to `useEffect`
  - Fixed all window references to use `globalThis.window`

## Changes Made

### Backend Scripts (package.json)
```json
{
  "dev": "tsx watch -r tsconfig-paths/register src/server.ts",
  "dev:local": "node scripts/kill-port.js && tsx watch -r tsconfig-paths/register src/server.ts",
  "dev:docker": "tsx watch -r tsconfig-paths/register src/server.ts",
  "start": "node -r tsconfig-paths/register dist/server.js"
}
```

### Server Configuration
- **Health Check**: `/healthz` endpoint added before all middleware
- **Host Binding**: Listens on `0.0.0.0:3001` in Docker, `localhost:3001` locally
- **Port Management**: Automatic fallback if port is busy (local only)

### Frontend API Configuration
- **New Env Var**: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` (without /api)
- **Legacy Support**: Still supports `NEXT_PUBLIC_API_URL` for backward compatibility
- **Health Check**: Login checks `/healthz` before attempting authentication

### Docker Configuration
- Uses `dev:docker` script (no kill-port)
- Sets `DOCKER_ENV=true` automatically
- Maps port `3001:3001`
- Healthcheck depends on database

## Files Modified

### Backend
- `backend/package.json` - Added `dev:docker` script
- `backend/src/server.ts` - Healthz endpoint, Docker host detection
- `backend/src/routes/health.ts` - Added `/healthz` endpoint
- `docker-compose.dev.yml` - Uses `dev:docker`, sets `DOCKER_ENV`

### Frontend
- `smart-schedule/lib/api-utils.ts` - Support for `NEXT_PUBLIC_API_BASE_URL`
- `smart-schedule/components/AuthProvider.tsx` - Health check, fixed hydration
- `smart-schedule/app/login/page.tsx` - Fixed hydration warnings
- `smart-schedule/lib/api.ts` - Fixed window references
- `smart-schedule/env.local.example` - Updated with new env var

## Environment Variables

### Backend (Docker automatically sets)
```env
PORT=3001
NODE_ENV=development
DOCKER_ENV=true
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL=postgresql://user:pass@database:5432/smartschedule
JWT_SECRET=your-secret-key
SESSION_COOKIE_SAMESITE=lax
SESSION_COOKIE_SECURE=false
```

### Frontend (.env.local)
```env
# New preferred variable (without /api suffix)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Legacy support (will be used if NEXT_PUBLIC_API_BASE_URL is not set)
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Usage

### Docker Development
```bash
# Start backend and database
docker-compose -f docker-compose.dev.yml up backend-dev database

# Backend will be available at http://localhost:3001
# Health check: http://localhost:3001/healthz
```

### Local Development
```bash
cd backend
npm run dev:local  # Kills port and starts
# OR
npm run dev        # Just starts (if port is free)
```

### Frontend
```bash
cd smart-schedule
# Ensure .env.local has NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
npm run dev
```

## Verification Checklist

✅ **Docker Startup:**
1. `docker-compose up backend-dev` → starts without MODULE_NOT_FOUND
2. No port conflicts
3. Server logs show "Server running on 0.0.0.0:3001"

✅ **Health Check:**
1. `curl http://localhost:3001/healthz` → returns 200
2. Response: `{"status":"ok","timestamp":"..."}`

✅ **Login Flow:**
1. Visit http://localhost:3000/login
2. No "Failed to fetch" error
3. Health check passes before login attempt
4. Valid credentials → successful login
5. User redirected based on role

✅ **Authentication:**
1. Cookies set correctly
2. Subsequent API calls include credentials
3. `/committee/access-requests` loads without 401

✅ **Hydration:**
1. No hydration warnings in console
2. All localStorage access is client-side only
3. SSR/client state matches

## Troubleshooting

**"Failed to fetch" still appears?**
1. Check backend is running: `curl http://localhost:3001/healthz`
2. Check Docker logs: `docker logs smartschedule-backend-dev`
3. Verify `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`
4. Check browser console for CORS errors

**Docker won't start?**
1. Check port 3001 isn't used locally
2. Stop local backend if running
3. Rebuild: `docker-compose build backend-dev`

**Health check fails?**
1. Verify database is running: `docker ps`
2. Check DATABASE_URL in docker-compose
3. Check backend logs for connection errors

**Login returns 401?**
1. Verify credentials are correct
2. Check user exists in database
3. Verify JWT_SECRET is set
4. Check cookies are being set (Network tab)

All issues are now resolved. The backend starts reliably in Docker, login works end-to-end, and hydration warnings are eliminated.

