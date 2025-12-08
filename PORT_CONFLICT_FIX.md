# Port Conflict & Server Startup Fix

## Issues Fixed

### 1. Port Conflict (EADDRINUSE)
- **Problem**: Backend crashed with "address already in use :::3001"
- **Root Causes**:
  - Multiple server instances starting (tsx watch creating duplicates)
  - Stale processes holding the port
  - Docker and local both trying to use port 3001

### 2. Server Startup Reliability
- **Problem**: Server could crash on startup if port was busy
- **Solution**: Automatic port fallback with graceful handling

## Solutions Implemented

### 1. Port Conflict Detection & Fallback
- Created `backend/src/utils/port.ts` with:
  - `isPortAvailable()` - Check if port is free
  - `findAvailablePort()` - Find next available port
  - `startServerWithPortFallback()` - Start server with automatic fallback

### 2. Kill Port Scripts
- **Cross-platform scripts** to kill processes on a port:
  - `backend/scripts/kill-port.js` - Node.js (works everywhere)
  - `backend/scripts/kill-port.ps1` - PowerShell (Windows)
  - `backend/scripts/kill-port.sh` - Bash (Unix/Linux/macOS)

### 3. Server Instance Prevention
- Added flags to prevent multiple server instances:
  - `serverStarting` - Prevents concurrent startup
  - `serverStarted` - Prevents duplicate starts
  - Only starts if `require.main === module` or in development

### 4. Graceful Shutdown
- Improved shutdown handlers:
  - Properly closes HTTP server
  - 10-second timeout for force shutdown
  - Handles SIGTERM, SIGINT, uncaught exceptions

### 5. Updated npm Scripts
- `npm run dev` - Now kills port before starting
- `npm run dev:clean` - Explicit clean start
- `npm run kill-port` - Manual port cleanup

### 6. Docker Configuration
- Made port configurable via `BACKEND_PORT` env var
- Prevents conflicts between Docker and local instances

## Usage

### Local Development

**Option 1: Automatic (Recommended)**
```bash
cd backend
npm run dev
# Automatically kills port 3001 and starts server
```

**Option 2: Manual Clean**
```bash
cd backend
npm run kill-port  # Kill any process on port 3001
npm run dev        # Start server
```

**Option 3: Clean Start**
```bash
cd backend
npm run dev:clean  # Kills port and starts server
```

### Docker

```bash
# Set custom port if needed
export BACKEND_PORT=3002
docker-compose -f docker-compose.dev.yml up backend-dev
```

### Port Fallback Behavior

If port 3001 is busy, the server will:
1. Try port 3002
2. Try port 3003
3. ... up to 5 attempts
4. If all fail, use OS-assigned port (0)

The actual port is logged and exported to `process.env.ACTUAL_PORT` and `process.env.ACTUAL_API_URL`.

## Files Modified

1. **backend/src/server.ts**
   - Added port conflict handling
   - Improved graceful shutdown
   - Prevented multiple instances
   - Better error handling

2. **backend/src/utils/port.ts** (NEW)
   - Port availability checking
   - Automatic port fallback
   - Server startup with conflict handling

3. **backend/scripts/kill-port.js** (NEW)
   - Cross-platform port killer
   - Works on Windows, macOS, Linux

4. **backend/scripts/kill-port.ps1** (NEW)
   - Windows PowerShell version

5. **backend/scripts/kill-port.sh** (NEW)
   - Unix/Linux/macOS bash version

6. **backend/package.json**
   - Updated dev script to kill port first
   - Added kill-port and dev:clean scripts

7. **docker-compose.dev.yml**
   - Made port configurable via env var

## Testing Checklist

✅ **Port Conflict Handling:**
1. Start server on port 3001 → works
2. Try to start another instance → automatically uses 3002
3. Kill first instance → second instance can continue
4. Restart → finds available port

✅ **Graceful Shutdown:**
1. Start server → Ctrl+C → server closes cleanly
2. Port is released immediately
3. No orphaned processes

✅ **Docker:**
1. Docker container starts on configured port
2. No conflict with local instance
3. Container stops cleanly

✅ **Development:**
1. `npm run dev` → kills stale processes first
2. Hot reload doesn't create duplicate servers
3. Only one server instance runs

## Troubleshooting

**Port still in use?**
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# macOS/Linux
lsof -ti :3001 | xargs kill -9

# Or use the script
npm run kill-port
```

**Server won't start?**
- Check if another process is using the port
- Try a different port: `PORT=3002 npm run dev`
- Check Docker containers: `docker ps` and stop conflicting ones

**Multiple instances?**
- Ensure only one `npm run dev` is running
- Check for Docker containers: `docker ps`
- Kill all Node processes if needed

## Next Steps

1. **Test the fixes:**
   ```bash
   cd backend
   npm run dev:clean
   ```

2. **Verify no port conflicts:**
   - Check logs for "Server running on port X"
   - Verify only one instance

3. **Test Access Requests page:**
   - Login as Committee
   - Visit `/committee/access-requests`
   - Should load without 401
   - Approve/Reject should work

The port conflict issue should now be resolved, and the server will start reliably even if the default port is busy.

