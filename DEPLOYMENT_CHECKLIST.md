# Deployment Verification Checklist

Use this checklist to verify your SmartSchedule deployment is working correctly.

## Pre-Deployment

### Code Quality
- [ ] All tests pass (`npm test` in backend and frontend)
- [ ] TypeScript compilation succeeds (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors or warnings in development
- [ ] All environment variables are documented

### Configuration
- [ ] `.env.production` file created with all required variables
- [ ] `JWT_SECRET` is set and at least 32 characters long
- [ ] Database connection string is correct
- [ ] Frontend API URLs are correct
- [ ] CORS origins are configured
- [ ] SSL certificates are ready (for production)

### Security
- [ ] No secrets committed to git
- [ ] `.env` files are in `.gitignore`
- [ ] Database passwords are strong
- [ ] JWT secret is cryptographically secure
- [ ] Rate limiting is configured
- [ ] Security headers are set

## Build Verification

### Backend Build
- [ ] Docker build succeeds: `docker build -f backend/Dockerfile.prod -t test-backend ./backend`
- [ ] TypeScript compiles without errors
- [ ] Prisma Client generates successfully
- [ ] No missing dependencies

### Frontend Build
- [ ] Docker build succeeds: `docker build -f smart-schedule/Dockerfile.prod -t test-frontend ./smart-schedule`
- [ ] Next.js build completes: `npm run build`
- [ ] No build-time errors
- [ ] Environment variables are correctly embedded

## Deployment

### Services Started
- [ ] Database container is running
- [ ] Backend container is running
- [ ] Frontend container is running
- [ ] Redis container is running (if used)
- [ ] Nginx container is running (if used)

### Database
- [ ] Database connection successful
- [ ] Migrations ran successfully
- [ ] Prisma Client can query database
- [ ] Database schema is up to date

### Network
- [ ] Backend accessible on configured port
- [ ] Frontend accessible on configured port
- [ ] Services can communicate (backend → database, frontend → backend)
- [ ] External access works (if applicable)

## Post-Deployment Verification

### Health Checks

#### Backend Health
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```
- [ ] Health endpoint returns 200 OK
- [ ] Response includes timestamp
- [ ] Response time < 100ms

#### Frontend Health
```bash
curl http://localhost:3000
# Expected: HTML response
```
- [ ] Frontend serves HTML
- [ ] No 500 errors
- [ ] Page loads successfully

### API Endpoints

#### Public Endpoints
- [ ] `GET /api/health` - Returns 200
- [ ] `GET /api/version` - Returns version info (if exists)

#### Authentication
- [ ] `POST /api/auth/login` - Accepts valid credentials
- [ ] `POST /api/auth/register` - Creates new users (if enabled)
- [ ] `POST /api/auth/logout` - Logs out users
- [ ] `GET /api/auth/me` - Returns current user (when authenticated)

#### Protected Endpoints (require authentication)
- [ ] `GET /api/users/me` - Returns user info
- [ ] `GET /api/courses` - Returns courses list
- [ ] `GET /api/sections` - Returns sections list

### Frontend Functionality

#### Login Flow
- [ ] Login page loads: `https://yourdomain.com/login`
- [ ] Can submit login form
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows error message
- [ ] Session persists after page refresh

#### Dashboard
- [ ] Dashboard loads after login
- [ ] User role is correctly displayed
- [ ] Navigation works
- [ ] No console errors

#### Role-Specific Pages
- [ ] Student dashboard accessible (if student)
- [ ] Faculty dashboard accessible (if faculty)
- [ ] Committee dashboard accessible (if committee)
- [ ] Admin dashboard accessible (if admin)

### Database Operations

#### Read Operations
- [ ] Can fetch users
- [ ] Can fetch courses
- [ ] Can fetch sections
- [ ] Can fetch schedules

#### Write Operations (if applicable)
- [ ] Can create access requests
- [ ] Can update user preferences
- [ ] Can submit feedback

### Performance

#### Response Times
- [ ] API health check < 100ms
- [ ] API endpoints < 500ms (average)
- [ ] Frontend page load < 2s
- [ ] Database queries < 100ms (average)

#### Resource Usage
- [ ] Backend memory usage reasonable
- [ ] Frontend memory usage reasonable
- [ ] Database connection pool healthy
- [ ] No memory leaks

### Security

#### Authentication
- [ ] JWT tokens are generated correctly
- [ ] Tokens expire as configured
- [ ] Refresh tokens work
- [ ] Logout invalidates sessions

#### Authorization
- [ ] Students can't access admin routes
- [ ] Faculty can't access committee routes
- [ ] Role-based access control works

#### Security Headers
- [ ] CORS headers are correct
- [ ] Security headers are set (X-Frame-Options, etc.)
- [ ] HTTPS is enforced (production)
- [ ] Cookies are secure (production)

### Error Handling

#### Client Errors
- [ ] 400 Bad Request handled gracefully
- [ ] 401 Unauthorized redirects to login
- [ ] 403 Forbidden shows appropriate message
- [ ] 404 Not Found shows error page

#### Server Errors
- [ ] 500 errors are logged
- [ ] Error messages don't leak sensitive info
- [ ] Error pages are user-friendly

### Logging

#### Backend Logs
- [ ] Requests are logged
- [ ] Errors are logged
- [ ] Logs are readable
- [ ] Log levels are appropriate

#### Frontend Logs
- [ ] Console errors are minimal
- [ ] API errors are handled
- [ ] User actions are tracked (if applicable)

## Production-Specific Checks

### SSL/TLS
- [ ] HTTPS is enabled
- [ ] SSL certificate is valid
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal configured (Let's Encrypt)

### Domain Configuration
- [ ] Domain points to correct IP
- [ ] DNS records are correct
- [ ] Subdomain routing works (if applicable)

### Monitoring
- [ ] Health checks are configured
- [ ] Uptime monitoring is set up
- [ ] Error tracking is configured (Sentry, etc.)
- [ ] Log aggregation is set up

### Backups
- [ ] Database backups are configured
- [ ] Backup restoration tested
- [ ] Backup retention policy set

### Scaling
- [ ] Horizontal scaling works (if applicable)
- [ ] Load balancing configured (if applicable)
- [ ] Session storage is shared (if multiple instances)

## Rollback Plan

If deployment fails:

1. [ ] Identify the issue from logs
2. [ ] Rollback to previous version
3. [ ] Verify rollback succeeded
4. [ ] Document the issue
5. [ ] Fix the issue before redeploying

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Check user feedback
- [ ] Verify all features work
- [ ] Monitor resource usage

### First Week
- [ ] Review logs daily
- [ ] Check for performance issues
- [ ] Monitor database growth
- [ ] Verify backups are running
- [ ] Check SSL certificate expiration

## Documentation

- [ ] Deployment guide is updated
- [ ] Environment variables are documented
- [ ] Runbook is available
- [ ] Troubleshooting guide is accessible
- [ ] Team knows how to access logs

## Sign-Off

- [ ] All critical checks passed
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured
- [ ] Rollback plan tested
- [ ] Documentation updated

**Deployed by:** _________________  
**Date:** _________________  
**Version:** _________________  
**Status:** ☐ Success  ☐ Failed  ☐ Partial

---

## Quick Health Check Script

```bash
#!/bin/bash
# Quick deployment health check

echo "🔍 Checking Backend Health..."
curl -f http://localhost:3001/api/health && echo "✅ Backend OK" || echo "❌ Backend Failed"

echo "🔍 Checking Frontend..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo "🔍 Checking Database Connection..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma db execute --stdin <<< "SELECT 1;" && echo "✅ Database OK" || echo "❌ Database Failed"

echo "✅ Health check complete!"
```

