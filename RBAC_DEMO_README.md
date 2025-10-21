# 🔒 SmartSchedule RBAC Demo

## Overview

This demo showcases the **Role-Based Access Control (RBAC)** system implemented in SmartSchedule. The system enforces granular permissions based on user roles: **STUDENT**, **FACULTY**, and **COMMITTEE**.

## 🚀 Quick Start

### 1. Setup the Demo

**Windows:**
```bash
scripts\setup-rbac-complete.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-rbac-complete.sh
./scripts/setup-rbac-complete.sh
```

### 🔒 Security Improvements

- **No Role Selection**: Users cannot choose their role - it's determined by the database
- **Proper Authentication**: Must use valid credentials from the database  
- **RBAC Enforcement**: All routes are protected by role-based permissions
- **JWT Tokens**: Secure authentication with access and refresh tokens

### 2. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd smart-schedule
npm run dev
```

### 3. Access the Demo

- **Login Page**: http://localhost:3000/login
- **RBAC Test Page**: http://localhost:3000/rbac-test
- **Backend API**: http://localhost:3001

## 👥 Demo Users

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `student@demo.com` | `TestPassword123!` | STUDENT | Basic access only |
| `faculty@demo.com` | `TestPassword123!` | FACULTY | Teaching functions |
| `committee@demo.com` | `TestPassword123!` | COMMITTEE | Full admin access |
| `admin@demo.com` | `TestPassword123!` | COMMITTEE | Full admin access |

## 🔐 RBAC Permission Matrix

### User Management
| Action | STUDENT | FACULTY | COMMITTEE |
|--------|---------|---------|-----------|
| Read own profile | ✅ | ✅ | ✅ |
| Read all users | ❌ | ❌ | ✅ |
| Create users | ❌ | ❌ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Update any user | ❌ | ❌ | ✅ |
| Delete any user | ❌ | ❌ | ✅ |

### Course Management
| Action | STUDENT | FACULTY | COMMITTEE |
|--------|---------|---------|-----------|
| View courses | ✅ | ✅ | ✅ |
| Create courses | ❌ | ❌ | ✅ |
| Update courses | ❌ | ❌ | ✅ |
| Delete courses | ❌ | ❌ | ✅ |

### Schedule Management
| Action | STUDENT | FACULTY | COMMITTEE |
|--------|---------|---------|-----------|
| View schedules | ✅ | ✅ | ✅ |
| Create schedules | ❌ | ❌ | ✅ |
| Publish schedules | ❌ | ❌ | ✅ |
| Approve schedules | ❌ | ❌ | ✅ |

### System Administration
| Action | STUDENT | FACULTY | COMMITTEE |
|--------|---------|---------|-----------|
| View system logs | ❌ | ❌ | ✅ |
| Create backups | ❌ | ❌ | ✅ |
| System maintenance | ❌ | ❌ | ✅ |

## 🧪 Testing RBAC

### 1. Frontend Testing

1. **Login with different roles**:
   - Go to http://localhost:3000/login
   - Use the demo credentials above
   - Notice how the interface changes based on role

2. **RBAC Test Page**:
   - Go to http://localhost:3000/rbac-test
   - Run permission tests for each role
   - Verify that permissions match expectations

### 2. API Testing

**Test Endpoints:**
```bash
# Basic RBAC test
GET /api/rbac-test/test-rbac

# User management (COMMITTEE only)
GET /api/rbac-test/users
POST /api/rbac-test/users
PUT /api/rbac-test/users/:id
DELETE /api/rbac-test/users/:id

# Course management (COMMITTEE only)
POST /api/rbac-test/courses
PUT /api/rbac-test/courses/:id
DELETE /api/rbac-test/courses/:id

# Schedule management (COMMITTEE only)
POST /api/rbac-test/schedules
PATCH /api/rbac-test/schedules/:id/publish

# System administration (COMMITTEE only)
GET /api/rbac-test/system/logs
POST /api/rbac-test/system/backup
```

**Test with curl:**
```bash
# Login as student (role determined by database)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@demo.com","password":"TestPassword123!"}'

# Test user read (should fail for student)
curl -X GET http://localhost:3001/api/rbac-test/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Login as committee (role determined by database)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"committee@demo.com","password":"TestPassword123!"}'

# Test user read (should succeed for committee)
curl -X GET http://localhost:3001/api/rbac-test/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Automated Testing

**Run the test script:**
```bash
node scripts/test-rbac.js
```

## 🔧 RBAC Implementation Details

### 1. Middleware Structure

```typescript
// Authentication middleware
authenticateToken(req, res, next)

// RBAC permission middleware
requirePermission(resource, action)(req, res, next)

// Example usage
router.get('/users', authenticateToken, requireUserRead, handler)
```

### 2. Permission System

```typescript
// Permission matrix
const RBAC_POLICIES = [
  { resource: 'users', action: 'read:any', roles: ['COMMITTEE'] },
  { resource: 'users', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'courses', action: 'create', roles: ['COMMITTEE'] },
  // ... more permissions
]
```

### 3. Security Features

- **Default Deny**: All access denied unless explicitly permitted
- **Audit Logging**: All security events tracked
- **Token Validation**: JWT tokens with role verification
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against abuse

## 📊 Expected Test Results

### Student Login
- ✅ Can access basic endpoints
- ❌ Cannot access admin functions
- ❌ Cannot create/update/delete users
- ❌ Cannot access system logs

### Faculty Login
- ✅ Can access teaching-related endpoints
- ❌ Cannot access admin functions
- ❌ Cannot create/update/delete users
- ❌ Cannot access system logs

### Committee Login
- ✅ Can access all endpoints
- ✅ Can manage users
- ✅ Can manage courses and schedules
- ✅ Can access system administration

## 🐛 Troubleshooting

### Common Issues

1. **"User not found" error**:
   - Run `npm run db:mock-users` to create demo users
   - Check database connection

2. **"Permission denied" error**:
   - Verify you're using the correct role in login
   - Check that the RBAC middleware is properly configured

3. **"Token invalid" error**:
   - Make sure you're using the JWT token from login response
   - Check token expiration (15 minutes)

### Debug Steps

1. **Check backend logs**:
   ```bash
   cd backend
   npm run dev
   # Look for security logs in console
   ```

2. **Verify database**:
   ```bash
   cd backend
   npx prisma studio
   # Check users table
   ```

3. **Test API directly**:
   ```bash
   curl -X GET http://localhost:3001/api/health
   ```

## 📚 Additional Resources

- **Security Documentation**: [SECURITY.md](./SECURITY.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Documentation**: http://localhost:3001/api/health
- **Database Schema**: `backend/prisma/schema.prisma`

## 🎯 Learning Objectives

After completing this demo, you should understand:

1. **RBAC Concepts**: How role-based access control works
2. **Permission Matrix**: How to define and enforce permissions
3. **Security Middleware**: How to implement security checks
4. **Audit Logging**: How to track security events
5. **Testing Security**: How to verify RBAC implementation

## 🚀 Next Steps

1. **Explore the Code**: Check `backend/src/middleware/rbac.ts`
2. **Add New Permissions**: Extend the permission matrix
3. **Create New Roles**: Add custom roles with specific permissions
4. **Implement Frontend**: Add role-based UI components
5. **Deploy to Production**: Follow the deployment guide

---

**🎉 Happy Testing!** 

The RBAC system is now fully functional with comprehensive security measures. Use different browser tabs to test different roles and see how the system enforces permissions.
