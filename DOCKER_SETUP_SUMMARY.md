# Docker Setup Summary - SmartSchedule

## ✅ Configuration Complete

All Docker configuration files have been restored and configured for local development.

## 📁 Files Modified/Created

### 1. `docker-compose.dev.yml`
- ✅ Database service (PostgreSQL 16)
- ✅ Backend service with hot-reload
- ✅ Frontend service with hot-reload
- ✅ Proper healthchecks for all services
- ✅ Cookie settings for localhost (secure: false, sameSite: lax)
- ✅ CORS configuration for http://localhost:3000
- ✅ Environment variables with sensible defaults

### 2. `smart-schedule/Dockerfile.dev`
- ✅ Next.js development server
- ✅ Binds to 0.0.0.0:3000 for Docker access
- ✅ Hot-reload enabled

### 3. `smart-schedule/app/api/healthz/route.ts`
- ✅ Health check endpoint at `/api/healthz`
- ✅ Returns `{status: "ok"}`

### 4. `smart-schedule/package.json`
- ✅ `dev:docker` script: `next dev -H 0.0.0.0 -p 3000`
- ✅ `dev` script: `next dev -p 3000` (for local non-Docker)

### 5. `start-docker.ps1`
- ✅ PowerShell script to start the stack

## 🚀 Quick Start Commands

### Start the Stack
```powershell
# Option 1: Use the startup script
.\start-docker.ps1

# Option 2: Manual commands
cd C:\Users\bssam\SmartSchedule
docker compose -f docker-compose.dev.yml up -d --build
```

### Stop the Stack
```powershell
docker compose -f docker-compose.dev.yml down
```

### Stop and Remove Volumes (Clean Slate)
```powershell
docker compose -f docker-compose.dev.yml down -v
```

### View Logs
```powershell
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f frontend-dev
docker compose -f docker-compose.dev.yml logs -f backend-dev
docker compose -f docker-compose.dev.yml logs -f database
```

### Check Container Status
```powershell
docker compose -f docker-compose.dev.yml ps
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Backend Health**: http://localhost:3001/healthz
- **Frontend Health**: http://localhost:3000/api/healthz
- **Database**: localhost:5432

## 🔧 Environment Variables (Defaults)

All environment variables have sensible defaults - no configuration needed!

### Database
- `POSTGRES_USER`: smartschedule
- `POSTGRES_PASSWORD`: dev_password
- `POSTGRES_DB`: smartschedule_dev

### Backend
- `JWT_SECRET`: dev-secret-key-not-for-production
- `SESSION_COOKIE_SECURE`: false (for localhost)
- `SESSION_COOKIE_SAMESITE`: lax
- `ALLOWED_ORIGINS`: http://localhost:3000,http://localhost:3001

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`: http://localhost:3001
- `NODE_ENV`: development

## ✅ Verification Steps

After starting the containers, verify everything works:

1. **Check container health:**
   ```powershell
   docker compose -f docker-compose.dev.yml ps
   ```
   All containers should show as "healthy" or "running"

2. **Test frontend health endpoint:**
   ```powershell
   curl http://localhost:3000/api/healthz
   ```
   Should return: `{"status":"ok",...}`

3. **Test backend health endpoint:**
   ```powershell
   curl http://localhost:3001/healthz
   ```
   Should return: `{"status":"ok",...}`

4. **Open in browser:**
   - Visit http://localhost:3000
   - Should see the SmartSchedule landing page
   - Click "Sign In" → should load login page
   - Login should work (cookies will be set correctly)

5. **Test Access Requests (Committee role):**
   - Login as a committee member
   - Navigate to Access Requests page
   - Should load without 401/500 errors

## 🔍 Troubleshooting

### Containers won't start
- Ensure Docker Desktop is running
- Check disk space: `docker system df`
- Clean up: `docker system prune -a --volumes`

### Frontend shows ERR_EMPTY_RESPONSE
- Check logs: `docker compose -f docker-compose.dev.yml logs frontend-dev`
- Ensure Next.js is binding to 0.0.0.0 (check logs for "started server on 0.0.0.0:3000")

### Backend connection errors
- Check database is healthy: `docker compose -f docker-compose.dev.yml ps database`
- Check backend logs: `docker compose -f docker-compose.dev.yml logs backend-dev`
- Verify DATABASE_URL in backend logs

### Cookie/Auth issues
- Ensure `SESSION_COOKIE_SECURE=false` in docker-compose.dev.yml
- Ensure `SESSION_COOKIE_SAMESITE=lax` in docker-compose.dev.yml
- Check browser console for CORS errors
- Verify `ALLOWED_ORIGINS` includes http://localhost:3000

## 📝 Key Features

✅ **Hot-reload**: Code changes automatically reload in containers  
✅ **Health checks**: All services have health endpoints  
✅ **Cookie support**: Properly configured for localhost development  
✅ **CORS**: Configured to allow browser requests from localhost:3000  
✅ **Sensible defaults**: No manual configuration required  
✅ **One command start**: `docker compose up -d --build`

## 🎯 Next Steps

1. Start Docker Desktop (if not running)
2. Run `.\start-docker.ps1` or use the manual commands above
3. Wait for containers to become healthy (~30-60 seconds)
4. Open http://localhost:3000 in your browser
5. Test login and protected routes

---

**All configuration is complete and ready to use!**

