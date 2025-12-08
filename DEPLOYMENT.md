# SmartSchedule Deployment Guide

This guide covers deploying SmartSchedule to production using Docker and various deployment platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Docker Deployment](#docker-deployment)
4. [Platform-Specific Deployment](#platform-specific-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (local or managed)
- Redis (optional, for rate limiting and sessions)
- Domain name and SSL certificates (for production)
- Environment variables configured

## Environment Variables

### Backend Environment Variables

Create `backend/.env` or set these in your deployment platform:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# JWT Configuration
JWT_SECRET=your-very-long-random-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Redis (optional)
REDIS_URL=redis://redis:6379

# WebAuthn
RP_ID=yourdomain.com
RP_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `smart-schedule/.env.local` or set these in your deployment platform:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_EXTERNAL_API_URL=https://yourdomain.com

# Application
NODE_ENV=production
PORT=3000
```

### Production Docker Compose Environment

Create `.env.production` in the project root:

```bash
# Database
POSTGRES_USER=smartschedule
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DB=smartschedule_prod

# Backend
JWT_SECRET=your-very-long-random-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_EXTERNAL_API_URL=https://yourdomain.com

# Redis
REDIS_PASSWORD=your-redis-password

# WebAuthn
RP_ID=yourdomain.com
RP_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

## Docker Deployment

### Production Build

1. **Build production images:**

```bash
# Build backend
docker build -f backend/Dockerfile.prod -t smartschedule-backend:latest ./backend

# Build frontend
docker build -f smart-schedule/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=https://yourdomain.com/api \
  --build-arg NEXT_PUBLIC_EXTERNAL_API_URL=https://yourdomain.com \
  -t smartschedule-frontend:latest ./smart-schedule
```

2. **Start services with Docker Compose:**

```bash
# Copy environment template
cp env.production.template .env.production

# Edit .env.production with your values
nano .env.production

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Service Architecture

The production setup includes:

- **PostgreSQL**: Database service
- **Redis**: Caching and rate limiting
- **Backend**: Express API server (port 3001)
- **Frontend**: Next.js application (port 3000)
- **Nginx**: Reverse proxy and SSL termination (ports 80, 443)

### Health Checks

Verify services are running:

```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend health
curl http://localhost:3000

# Through Nginx
curl https://yourdomain.com/api/health
```

## Platform-Specific Deployment

### Railway

Railway automatically detects Dockerfiles and deploys services. Configuration is in `railway.toml` files.

1. **Connect GitHub repository** to Railway
2. **Create services:**
   - Backend service (uses `backend/Dockerfile.prod`)
   - Frontend service (uses `smart-schedule/Dockerfile.prod`)
   - PostgreSQL database service
   - Redis service (optional)

3. **Set environment variables** in Railway dashboard for each service

4. **Deploy:** Railway automatically deploys on push to main branch

### Vercel (Frontend Only)

For Next.js frontend on Vercel:

1. Connect GitHub repository
2. Set root directory to `smart-schedule`
3. Configure environment variables
4. Deploy

**Note:** Backend must be deployed separately (Railway, Heroku, etc.)

### Heroku

1. **Install Heroku CLI**

2. **Create apps:**
```bash
heroku create smartschedule-backend
heroku create smartschedule-frontend
```

3. **Add PostgreSQL:**
```bash
heroku addons:create heroku-postgresql:hobby-dev -a smartschedule-backend
```

4. **Set environment variables:**
```bash
heroku config:set JWT_SECRET=your-secret -a smartschedule-backend
# ... add all required variables
```

5. **Deploy:**
```bash
# Backend
cd backend
heroku git:remote -a smartschedule-backend
git push heroku main

# Frontend
cd smart-schedule
heroku git:remote -a smartschedule-frontend
git push heroku main
```

### DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Create apps:**
   - Backend component (Dockerfile: `backend/Dockerfile.prod`)
   - Frontend component (Dockerfile: `smart-schedule/Dockerfile.prod`)
   - Database component (PostgreSQL)
   - Redis component (optional)

3. **Configure environment variables** in each component

4. **Deploy:** Automatic on push to main branch

### AWS (ECS/EKS)

1. **Build and push images to ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -f backend/Dockerfile.prod -t smartschedule-backend ./backend
docker tag smartschedule-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/smartschedule-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/smartschedule-backend:latest
```

2. **Create ECS task definitions** with environment variables

3. **Deploy services** using ECS or EKS

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend API
curl https://yourdomain.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Frontend
curl https://yourdomain.com
# Expected: HTML response
```

### 2. Database Connection

```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend | grep -i database

# Or via Railway/Heroku logs
railway logs backend
# or
heroku logs --tail -a smartschedule-backend
```

### 3. Authentication Flow

1. Visit `https://yourdomain.com/login`
2. Attempt to log in with valid credentials
3. Verify redirect to dashboard
4. Check browser console for errors

### 4. API Endpoints

```bash
# Test protected endpoint (requires auth)
curl -X GET https://yourdomain.com/api/users/me \
  -H "Cookie: session=your-session-cookie"

# Test public endpoint
curl https://yourdomain.com/api/health
```

### 5. Database Migrations

Verify migrations ran successfully:

```bash
# Check backend logs for migration output
docker-compose -f docker-compose.prod.yml logs backend | grep -i migration

# Or connect to database and check schema
psql $DATABASE_URL -c "\dt"
```

## Troubleshooting

### Backend Won't Start

**Symptoms:** Container exits immediately or health check fails

**Solutions:**
1. Check logs: `docker-compose logs backend`
2. Verify `DATABASE_URL` is correct and database is accessible
3. Ensure `JWT_SECRET` is set and at least 32 characters
4. Check port conflicts (default: 3001)

### Frontend Build Fails

**Symptoms:** Build error during Docker build or deployment

**Solutions:**
1. Verify `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_EXTERNAL_API_URL` are set
2. Check for TypeScript errors: `cd smart-schedule && npm run typecheck`
3. Ensure all dependencies are installed: `npm ci`

### Database Connection Errors

**Symptoms:** `P1001: Can't reach database server`

**Solutions:**
1. Verify `DATABASE_URL` format is correct
2. Check database is running and accessible
3. For Railway: Ensure using `postgres.railway.internal:5432` for internal connections
4. For external databases: Verify firewall rules and SSL requirements

### CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Verify `FRONTEND_URL` matches your actual domain
2. Check `ALLOWED_ORIGINS` includes your domain
3. Ensure Nginx is forwarding correct headers

### Session/Cookie Issues

**Symptoms:** Users can't stay logged in

**Solutions:**
1. Verify `SESSION_COOKIE_SECURE=true` for HTTPS
2. Check `SESSION_COOKIE_SAMESITE` setting
3. Ensure domain matches in cookie settings
4. Check Redis connection if using Redis sessions

### Rate Limiting Issues

**Symptoms:** Legitimate requests are rate limited

**Solutions:**
1. Adjust rate limit settings in `backend/src/middleware/security.ts`
2. Check Redis connection if using Redis for rate limiting
3. Verify IP forwarding in Nginx configuration

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set and secure
- [ ] `JWT_SECRET` is a strong random string (32+ characters)
- [ ] Database passwords are strong and unique
- [ ] SSL/TLS certificates are configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are set (via Nginx/Helmet)
- [ ] Database backups are configured
- [ ] Logging is configured and monitored
- [ ] Health checks are working
- [ ] Non-root users are used in containers
- [ ] Secrets are not committed to git

## Monitoring

### Recommended Monitoring

1. **Application Logs:** Use platform logging (Railway, Heroku, etc.)
2. **Database Monitoring:** Monitor connection pool, query performance
3. **Error Tracking:** Integrate Sentry or similar
4. **Uptime Monitoring:** Use UptimeRobot or similar
5. **Performance:** Monitor API response times and frontend load times

### Log Locations

- **Docker:** `docker-compose logs [service-name]`
- **Railway:** Dashboard → Service → Logs
- **Heroku:** `heroku logs --tail -a [app-name]`
- **Backend logs:** `/app/logs` (if configured)

## Backup and Recovery

### Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```

### Automated Backups

Configure automated backups in your database provider:
- **Railway:** Automatic daily backups
- **Heroku:** Use Heroku Postgres backups addon
- **AWS RDS:** Enable automated backups
- **DigitalOcean:** Use managed database backups

## Updates and Rollbacks

### Updating Application

1. **Pull latest changes:**
```bash
git pull origin main
```

2. **Rebuild and redeploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. **Run migrations:**
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Rollback

1. **Revert to previous version:**
```bash
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

2. **Or use platform-specific rollback:**
- Railway: Dashboard → Deployments → Rollback
- Heroku: `heroku releases:rollback -a [app-name]`

## Support

For issues or questions:
1. Check logs first
2. Review this deployment guide
3. Check GitHub Issues
4. Contact the development team
