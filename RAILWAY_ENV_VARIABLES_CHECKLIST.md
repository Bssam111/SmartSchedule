# Railway Environment Variables Checklist

## ✅ Backend Service (handsome-radiance) - Current Status

Based on your Railway dashboard, you have:
- ✅ `DATABASE_URL` - `postgresql://postgres:...@postgres.railway.internal:5432/railway`
- ✅ `JWT_SECRET` - Set (hidden)
- ✅ `PORT` - `3001`
- ✅ `REDIS_URL` - `redis://default:...@redis.railway.internal:6379`

## ⚠️ Missing/Recommended Variables for Backend

### Required (with defaults, but recommended to set):
- ⚠️ `JWT_EXPIRES_IN` - Default: `7d` (recommended: `7d`)
- ⚠️ `JWT_REFRESH_EXPIRES_IN` - Default: `30d` (recommended: `30d`)
- ⚠️ `WEBAUTHN_RP_ID` - Default: `localhost` (should be: `smartschedule24.com`)
- ⚠️ `WEBAUTHN_ORIGIN` - Default: `http://localhost:3000` (should be: `https://smartschedule24.com`)
- ⚠️ `FRONTEND_URL` - Used for CORS (should be: `https://smartschedule24.com`)
- ⚠️ `WS_PORT` - Default: `3002` (optional, only if using WebSocket)

### Optional:
- `NODE_ENV` - Usually set automatically by Railway to `production`
- `LOG_LEVEL` - Default: `info` (optional)

## ⚠️ Frontend Service (SmartSchedule) - Missing Variables

### Required:
- ❌ `DATABASE_URL` - **MISSING** (needed for Prisma Client generation)
- ❌ `NEXT_PUBLIC_API_URL` - **MISSING** (required for API calls, should be: `https://smartschedule24.com/api`)
- ❌ `NEXT_PUBLIC_EXTERNAL_API_URL` - **MISSING** (should be: `https://smartschedule24.com`)

## 📋 Action Items

### For Backend (handsome-radiance):
Add these variables in Railway → handsome-radiance → Variables:

1. **JWT_EXPIRES_IN** = `7d`
2. **JWT_REFRESH_EXPIRES_IN** = `30d`
3. **WEBAUTHN_RP_ID** = `smartschedule24.com`
4. **WEBAUTHN_ORIGIN** = `https://smartschedule24.com`
5. **FRONTEND_URL** = `https://smartschedule24.com`

### For Frontend (SmartSchedule):
Add these variables in Railway → SmartSchedule → Variables:

1. **DATABASE_URL** = (Use Railway's shared variable reference to Postgres)
   - Click "Shared Variable" → Select `DATABASE_URL` from Postgres service
2. **NEXT_PUBLIC_API_URL** = `https://smartschedule24.com/api`
3. **NEXT_PUBLIC_EXTERNAL_API_URL** = `https://smartschedule24.com`

## 🔍 How to Add Variables in Railway

1. Go to your service (handsome-radiance or SmartSchedule)
2. Click **Variables** tab
3. Click **"+ New Variable"**
4. Enter the variable name and value
5. Click **"Add"**

## ⚠️ Important Notes

- **NEXT_PUBLIC_*** variables are exposed to the browser, so they must be set in the frontend service
- **DATABASE_URL** for frontend should reference the same Postgres database (use Railway's shared variable feature)
- **WEBAUTHN_RP_ID** and **WEBAUTHN_ORIGIN** must match your actual domain
- All URLs should use `https://` in production

## ✅ Current Status Summary

**Backend (handsome-radiance):**
- ✅ Core variables set (DATABASE_URL, JWT_SECRET, PORT, REDIS_URL)
- ⚠️ Missing WebAuthn and CORS configuration variables

**Frontend (SmartSchedule):**
- ❌ Missing all required variables (DATABASE_URL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_EXTERNAL_API_URL)


