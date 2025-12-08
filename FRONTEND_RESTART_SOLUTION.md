# Frontend Restart Issue - SOLVED ✅

## Problem

The frontend container was constantly restarting. Next.js would start, show "✓ Starting..." but then exit and restart in a loop.

## Root Cause

The issue was caused by two problems:

1. **File Watcher Issue on Windows + Docker**: The file watcher wasn't working properly with Docker volume mounts on Windows, causing Next.js to exit silently.

2. **next.config.ts Change Detection Loop**: After fixing the file watcher, Next.js detected repeated changes to `next.config.ts`, causing constant server restarts:
   ```
   ⚠ Found a change in next.config.ts. Restarting the server to apply the changes...
   ```

## Solutions Applied

### 1. Enable File Watcher Polling
Added `WATCHPACK_POLLING=true` to the dev:docker script to enable polling mode for file watching (required on Windows with Docker):

```json
"dev:docker": "WATCHPACK_POLLING=true next dev -H 0.0.0 -p 3000"
```

### 2. Exclude Config Files from Volume Mount
Added config files to anonymous volumes to prevent false change detection:

```yaml
volumes:
  - ./smart-schedule:/app:delegated
  - /app/node_modules
  - /app/.next
  - /app/next.config.ts  # Prevent false change detection
  - /app/next.config.js
  - /app/next.config.mjs
```

### 3. Disabled Healthcheck (Temporarily)
Disabled the healthcheck to eliminate it as a potential cause during troubleshooting.

## Result

✅ **Frontend container is now running stably!**

```bash
$ docker compose ps frontend
NAME                     STATUS
smartschedule-frontend   Up About a minute
```

The container:
- Starts Next.js successfully
- Shows "✓ Ready" message
- Stays running without constant restarts
- File watching works with polling enabled

## Files Modified

1. `smart-schedule/package.json` - Added WATCHPACK_POLLING to dev:docker script
2. `docker-compose.yml` - Excluded config files from volume mount

## Verification

```bash
# Check container status
docker compose ps frontend
# Expected: STATUS should show "Up" (not restarting)

# Check logs
docker compose logs frontend
# Expected: Should show "✓ Ready" without constant restarts

# Access frontend
curl http://localhost:3000
# Expected: Should return HTML response
```

---

**Status:** ✅ Fixed
**Date:** 2025-11-27




