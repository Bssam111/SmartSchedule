# Docker Frontend Setup - Implementation Summary

## Files Created/Modified

### 1. `smart-schedule/Dockerfile.dev` ✅ CREATED
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### 2. `smart-schedule/.env.docker` ✅ CREATED
```env
NEXT_PUBLIC_API_BASE_URL=http://backend-dev:3001
NEXT_PUBLIC_API_URL=http://backend-dev:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. `smart-schedule/package.json` ✅ MODIFIED
**Changed:**
```json
{
  "dev": "next dev -H 0.0.0.0 -p 3000",
  "start": "next start -p 3000"
}
```

### 4. `docker-compose.dev.yml` ✅ MODIFIED
**Frontend service updated:**
- Uses `Dockerfile.dev`
- Environment: `NEXT_PUBLIC_API_BASE_URL=http://backend-dev:3001`
- Volumes: Full source mount for hot-reload
- Depends on: `backend-dev`

### 5. `smart-schedule/lib/api.ts` ✅ MODIFIED
**Browser vs Server URL handling:**
- Browser: Always uses `http://localhost:3001/api` (can't resolve service names)
- Server: Uses service name from env (`http://backend-dev:3001/api`)

### 6. `smart-schedule/components/AuthProvider.tsx` ✅ MODIFIED
**Login URL handling:**
- Browser: Uses `http://localhost:3001/api`
- Server: Uses service name from env

### 7. `backend/src/middleware/security.ts` ✅ MODIFIED
**CORS origins:**
- Added `http://frontend-dev:3000` to allowed origins

## Docker Compose Configuration (Final)

```yaml
services:
  frontend-dev:
    build:
      context: ./smart-schedule
      dockerfile: Dockerfile.dev
    container_name: smartschedule-frontend-dev
    restart: unless-stopped
    depends_on:
      - backend-dev
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_BASE_URL: http://backend-dev:3001
      NEXT_PUBLIC_API_URL: http://backend-dev:3001/api
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    ports:
      - "3000:3000"
    networks:
      - smartschedule-dev-network
    volumes:
      - ./smart-schedule:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
```

## Key Implementation Details

### URL Resolution Strategy
1. **Server-side (SSR):** Uses `http://backend-dev:3001` (Docker service name)
2. **Browser-side:** Uses `http://localhost:3001` (browser can't resolve service names)

### Cookie Handling
- All fetch calls include `credentials: 'include'`
- Backend CORS allows `http://localhost:3000` with credentials
- Cookies set with `SameSite=Lax`, `Secure=false` for local dev

### Hot Reload
- Full source code mounted as volume
- `node_modules` and `.next` excluded from mount (performance)
- Changes to source files trigger Next.js hot reload

## Testing Commands

### Build and Start
```bash
docker compose -f docker-compose.dev.yml up -d --build frontend-dev
```

### Check Status
```bash
docker compose -f docker-compose.dev.yml ps
```

### View Logs
```bash
docker compose -f docker-compose.dev.yml logs -f frontend-dev
```

### Health Checks
```bash
# Backend
curl http://localhost:3001/healthz

# Frontend
curl http://localhost:3000
```

## Expected Behavior

1. **Frontend Container:**
   - Runs on port 3000
   - Accessible at http://localhost:3000
   - Hot-reload enabled

2. **API Calls:**
   - Browser → `http://localhost:3001/api/*`
   - Server → `http://backend-dev:3001/api/*`

3. **Login Flow:**
   - Browser makes request to `http://localhost:3001/api/auth/login`
   - Backend sets cookies
   - Subsequent requests include cookies automatically

4. **Protected Routes:**
   - `/committee/access-requests` loads after login
   - Cookies sent with requests
   - No 401 errors

## Troubleshooting

**Frontend not starting:**
- Check logs: `docker compose logs frontend-dev`
- Verify port 3000 not in use
- Check Dockerfile.dev syntax

**API calls failing:**
- Verify backend is running: `docker compose ps backend-dev`
- Check CORS configuration
- Verify environment variables

**Cookies not working:**
- Check browser DevTools → Application → Cookies
- Verify `credentials: 'include'` in fetch calls
- Check CORS allows credentials

