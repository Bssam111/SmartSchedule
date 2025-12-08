# Quick Start Guide - Docker & Local Development

## Docker Development (Recommended)

### Start All Services
```bash
docker-compose -f docker-compose.dev.yml up
```

### Start Only Backend
```bash
docker-compose -f docker-compose.dev.yml up backend-dev database
```

### Stop Services
```bash
docker-compose -f docker-compose.dev.yml down
```

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev:local  # Kills port 3001 and starts server
```

### Frontend
```bash
cd smart-schedule
npm install
npm run dev
```

## Environment Setup

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/smartschedule
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-min-32-chars
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Verification

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Login Test:**
   - Visit http://localhost:3000/login
   - Use Committee credentials
   - Should login successfully

3. **Access Requests:**
   - Login as Committee
   - Visit http://localhost:3000/committee/access-requests
   - Should load without 401

## Troubleshooting

**Port 3001 in use?**
```bash
# Windows
npm run kill-port

# Or manually
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**Docker won't start?**
```bash
# Check if port is used
docker ps

# Stop conflicting containers
docker-compose -f docker-compose.dev.yml down

# Rebuild if needed
docker-compose -f docker-compose.dev.yml build backend-dev
```

**"Failed to fetch" on login?**
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check Docker logs: `docker logs smartschedule-backend-dev`
3. Verify NEXT_PUBLIC_API_URL in frontend .env.local
4. Check browser console for CORS errors

