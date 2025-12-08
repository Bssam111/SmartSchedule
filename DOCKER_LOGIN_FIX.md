# Docker & Login Fix Summary

## Issues Fixed

### 1. Docker Backend Startup Failure
- **Problem**: `Error: Cannot find module '/app/scripts/kill-port.js'`
- **Root Cause**: Docker container was calling `npm run dev` which tried to run kill-port.js, but the script wasn't needed in Docker
- **Solution**: 
  - Created separate scripts: `dev:local` (with kill-port) and `dev:docker` (without)
  - Updated docker-compose to use `dev:docker`
  - Docker no longer tries to kill ports (not needed in container)

### 2. "Failed to fetch" on Login
- **Problem**: Frontend couldn't connect to backend
- **Root Causes**:
  - Backend might not be listening on 0.0.0.0 in Docker
  - CORS might not be configured correctly
  - Network connectivity issues
- **Solution**:
  - Backend now listens on 0.0.0.0 when in Docker (DOCKER_ENV=true)
  - Improved error messages for network failures
  - Verified CORS configuration
  - Ensured credentials are sent with requests

### 3. Port Conflicts
- **Problem**: EADDRINUSE errors
- **Solution**: 
  - Port conflict handling with automatic fallback
  - Kill-port scripts for local development only
  - Docker uses fixed port mapping

## Changes Made

### Backend Scripts (package.json)
- `dev` - Basic dev (no kill-port, for flexibility)
- `dev:local` - Local dev with port cleanup
- `dev:docker` - Docker dev (no port cleanup needed)
- `dev:clean` - Clean start with port cleanup

### Docker Configuration
- Added `DOCKER_ENV=true` to backend environment
- Backend listens on `0.0.0.0:3001` in Docker
- Uses `dev:docker` script (no kill-port)
- Proper healthcheck dependencies

### Server Startup
- Detects Docker environment
- Listens on appropriate host (0.0.0.0 for Docker, localhost for local)
- Port conflict handling only for localhost
- Better error messages

### Error Handling
- Improved "Failed to fetch" error messages
- Clear guidance when backend isn't running
- Better network error detection

## Usage

### Local Development
```bash
cd backend
npm run dev:local  # Kills port and starts
# OR
npm run dev        # Just starts (if port is free)
```

### Docker Development
```bash
docker-compose -f docker-compose.dev.yml up backend-dev
# Backend will start on 0.0.0.0:3001 inside container
# Mapped to localhost:3001 on host
```

### Testing Login
1. Ensure backend is running (Docker or local)
2. Visit http://localhost:3000/login
3. Enter credentials
4. Should successfully login and redirect

## Environment Variables

### Backend (.env or docker-compose)
```env
PORT=3001
NODE_ENV=development
DOCKER_ENV=true  # Set automatically in Docker
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL=postgresql://user:pass@database:5432/db
JWT_SECRET=your-secret-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Verification Checklist

✅ **Docker Startup:**
1. `docker-compose up backend-dev` → starts without errors
2. No "Cannot find module" errors
3. Server logs show "Server running on 0.0.0.0:3001"

✅ **Login Flow:**
1. Visit /login
2. Enter valid credentials
3. No "Failed to fetch" error
4. Successful login and redirect

✅ **Network:**
1. Backend accessible at http://localhost:3001/api/health
2. CORS allows requests from http://localhost:3000
3. Cookies are set and sent with requests

✅ **Port Management:**
1. Local dev kills stale processes
2. Docker uses fixed port (no conflicts)
3. Only one backend instance runs

## Troubleshooting

**"Failed to fetch" still appears?**
1. Check backend is running: `curl http://localhost:3001/api/health`
2. Check Docker logs: `docker logs smartschedule-backend-dev`
3. Verify NEXT_PUBLIC_API_URL in frontend
4. Check browser console for CORS errors

**Docker won't start?**
1. Check port 3001 isn't used: `netstat -an | findstr 3001` (Windows) or `lsof -i :3001` (Mac/Linux)
2. Stop local backend if running
3. Rebuild: `docker-compose build backend-dev`

**Login returns 401?**
1. Check credentials are correct
2. Verify user exists in database
3. Check JWT_SECRET is set
4. Verify cookies are being set (check Network tab)

All issues should now be resolved. The backend starts reliably in Docker, and login works end-to-end.

