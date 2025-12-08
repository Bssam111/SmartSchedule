# Validation Tests - Login & Docker Fix

## Pre-Test Checklist

✅ **Scripts Updated:**
- `backend/package.json` has `dev:local` (with kill-port) and `dev:docker` (without)
- `docker-compose.dev.yml` uses `npm run dev:docker`

✅ **Server Configuration:**
- Server listens on `0.0.0.0:3001` when `DOCKER_ENV=true`
- `/healthz` endpoint exists before all middleware
- CORS allows `http://localhost:3000`

✅ **Frontend Configuration:**
- `smart-schedule/.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
- API client uses `credentials: 'include'` for cookie auth

## Test Execution

### Test 1: Docker Build & Startup
```bash
# Clean start
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build

# Expected: Backend starts without MODULE_NOT_FOUND error
# Check logs: docker compose -f docker-compose.dev.yml logs backend-dev
# Should see: "🚀 Server running on 0.0.0.0:3001"
# Should see: "✅ Listening on 0.0.0.0:3001 (accessible from host)"
# Should NOT see: "Error: Cannot find module '/app/scripts/kill-port.js'"
```

### Test 2: Health Check
```bash
curl http://localhost:3001/healthz
# Expected: {"status":"ok","timestamp":"..."}
# Status code: 200
```

### Test 3: Frontend Connectivity
1. Open http://localhost:3000/login
2. Check browser console
3. Expected: No "Failed to fetch" error
4. Expected: Health check passes before login attempt

### Test 4: Login End-to-End
1. Enter valid credentials (e.g., `committee@ksu.edu.sa` + password)
2. Submit login form
3. Check Network tab:
   - `POST /api/auth/login` returns `200`
   - Response includes `Set-Cookie` headers (cookie auth)
   - Response JSON: `{"success":true,"user":{...}}`
4. Expected: Redirect to appropriate dashboard

### Test 5: Protected Route Access
1. After login, visit `/committee/access-requests`
2. Expected: Page loads without `401` error
3. Expected: Data displays (or empty state if no requests)

### Test 6: Regression - Refresh & Restart
1. Refresh login page → No "Failed to fetch"
2. Stop containers: `docker compose -f docker-compose.dev.yml down`
3. Restart: `docker compose -f docker-compose.dev.yml up -d`
4. Expected: No port conflicts, services start cleanly

## Success Criteria

✅ Backend starts in Docker without errors
✅ Health check returns 200
✅ Login succeeds and establishes auth
✅ Protected routes accessible after login
✅ No hydration warnings
✅ No port conflicts on restart

All tests passing = Fix complete!

