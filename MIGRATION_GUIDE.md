# Backend Migration Guide: Next.js API Routes → Express Server

This guide outlines the migration from Next.js API routes to a standalone Express server.

## Overview

The backend has been completely migrated from Next.js API routes to a standalone Node.js + Express server with the following improvements:

### New Architecture
- **Standalone Express Server**: Independent Node.js server
- **JWT Authentication**: Secure httpOnly cookie-based auth
- **TypeScript**: Full type safety throughout
- **Prisma ORM**: Type-safe database operations
- **Comprehensive Testing**: Vitest + Supertest
- **CI/CD**: GitHub Actions pipeline
- **Security**: Helmet, CORS, rate limiting

## Migration Steps

### 1. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your database URL and JWT secret
   ```

4. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

The Express server will run on `http://localhost:3001`

### 2. Frontend Configuration

Update the frontend to use the new Express API:

1. **Update API base URL in frontend:**
   ```typescript
   // In your frontend API client
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   ```

2. **Update environment variables:**
   ```env
   # Add to .env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Update API calls to use new endpoints:**
   - All API calls should now point to the Express server
   - Authentication now uses httpOnly cookies
   - Remove manual token handling from frontend

### 3. API Endpoint Changes

| Old Next.js Route | New Express Route | Changes |
|------------------|-------------------|---------|
| `/api/auth/login` | `POST /api/auth/login` | Now returns httpOnly cookies |
| `/api/auth/logout` | `POST /api/auth/logout` | Clears httpOnly cookies |
| `/api/courses` | `GET /api/courses` | Same response format |
| `/api/sections` | `GET /api/sections` | Same response format |
| `/api/health` | `GET /api/health` | Same response format |

### 4. Authentication Changes

**Before (Next.js):**
```typescript
// Manual token handling
const token = localStorage.getItem('token')
fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
})
```

**After (Express):**
```typescript
// Automatic cookie handling
fetch('/api/data', {
  credentials: 'include' // Include httpOnly cookies
})
```

### 5. Database Schema Updates

The Prisma schema has been updated with:
- Added `password` field to User model
- Enhanced relationships
- Added proper indexes
- Updated enum values

### 6. Testing

Run the new test suite:
```bash
cd backend
npm run test
npm run test:coverage
```

### 7. Deployment

**Development:**
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd smart-schedule
npm run dev
```

**Production:**
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd smart-schedule
npm run build
npm start
```

## Key Improvements

### Security
- ✅ JWT with httpOnly cookies (XSS protection)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with Zod

### Performance
- ✅ Standalone server (no Next.js overhead)
- ✅ Optimized database queries
- ✅ Compression middleware
- ✅ Connection pooling

### Developer Experience
- ✅ Full TypeScript support
- ✅ Comprehensive testing
- ✅ ESLint + Prettier
- ✅ CI/CD pipeline
- ✅ Hot reload in development

### Scalability
- ✅ Independent deployment
- ✅ Horizontal scaling support
- ✅ Database connection pooling
- ✅ Stateless authentication

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure `FRONTEND_URL` is set correctly in backend `.env`
   - Check that frontend is making requests with `credentials: 'include'`

2. **Authentication Issues:**
   - Clear browser cookies and localStorage
   - Check that JWT_SECRET is set in backend
   - Verify httpOnly cookies are being set

3. **Database Connection:**
   - Verify DATABASE_URL is correct
   - Run `npm run db:push` to sync schema
   - Check PostgreSQL is running

4. **Port Conflicts:**
   - Backend runs on port 3001 by default
   - Frontend runs on port 3000
   - Update PORT in backend .env if needed

### Migration Checklist

- [ ] Backend server running on port 3001
- [ ] Database schema migrated
- [ ] Frontend updated to use new API
- [ ] Authentication working with cookies
- [ ] All API endpoints responding
- [ ] Tests passing
- [ ] CI/CD pipeline configured

## Support

If you encounter issues during migration:

1. Check the backend logs for errors
2. Verify environment variables are set
3. Ensure database is accessible
4. Check network connectivity between frontend and backend
5. Review the API documentation in `backend/README.md`
