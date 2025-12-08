# Backend Connection Troubleshooting Guide

## Issue: "Failed to fetch" - Backend not accessible on localhost:3001

### Quick Diagnosis Steps

1. **Check if backend container is running:**
   ```bash
   docker ps | findstr backend
   # Should show: smartschedule-backend-dev
   ```

2. **Check backend logs:**
   ```bash
   docker logs smartschedule-backend-dev --tail 50
   # Look for: "🚀 Server running on 0.0.0.0:3001"
   ```

3. **Check if port 3001 is in use:**
   ```bash
   netstat -ano | findstr :3001
   # Should show the Docker container using the port
   ```

4. **Test backend directly:**
   ```bash
   curl http://localhost:3001/healthz
   # Should return: {"status":"ok","timestamp":"..."}
   ```

### Common Issues and Fixes

#### Issue 1: Backend container not running
**Fix:**
```bash
docker-compose -f docker-compose.dev.yml up -d backend-dev
```

#### Issue 2: Backend container crashed
**Check logs:**
```bash
docker logs smartschedule-backend-dev
```

**Common causes:**
- Database connection failed
- Port already in use
- Missing environment variables

**Fix:**
```bash
# Restart the container
docker-compose -f docker-compose.dev.yml restart backend-dev

# Or rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build backend-dev
```

#### Issue 3: Port 3001 already in use
**Check:**
```bash
netstat -ano | findstr :3001
```

**Fix:**
- Stop the process using port 3001, OR
- Change BACKEND_PORT in docker-compose.dev.yml to a different port

#### Issue 4: Backend listening on wrong interface
**Check logs for:**
```
🚀 Server running on 0.0.0.0:3001
✅ Listening on 0.0.0.0:3001 (accessible from host)
```

If it says `localhost:3001` instead of `0.0.0.0:3001`, the DOCKER_ENV variable might not be set.

**Fix:** Ensure `DOCKER_ENV: "true"` is set in docker-compose.dev.yml

### Restart Everything

If nothing works, restart all services:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

Then check logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f backend-dev
```

