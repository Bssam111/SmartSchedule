# Fix: "Unexpected token '<', "<!DOCTYPE"..." JSON Error

## 🚨 Problem

You're seeing this error on the login page:
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Root Cause**: The frontend is making API calls expecting JSON responses, but the backend is returning HTML instead (likely a 404 error page or server error page).

## 🔍 Why This Happens

1. **Missing Environment Variable**: `NEXT_PUBLIC_API_URL` is not set in Railway
   - Frontend defaults to `http://localhost:3001/api` (doesn't exist in production)
   - Requests fail and return HTML error pages

2. **Backend Not Running**: The backend service might be down or not accessible

3. **Wrong API URL**: The API URL might be pointing to the wrong service

4. **CORS Issues**: CORS errors can sometimes return HTML instead of JSON

## ✅ Solution

### Step 1: Add Environment Variables in Railway

The frontend service needs `NEXT_PUBLIC_API_URL` to know where the backend is.

1. **Go to Railway → SmartSchedule (frontend) → Variables**
2. **Click "+ New Variable"**
3. **Add these variables**:

   **NEXT_PUBLIC_API_URL**
   - Value: `https://smartschedule24.com/api`
   - Description: Backend API URL for frontend requests
   - ⚠️ **CRITICAL**: Must include `/api` at the end

   **NEXT_PUBLIC_EXTERNAL_API_URL**
   - Value: `https://smartschedule24.com`
   - Description: External API URL for WebAuthn and other services

   **DATABASE_URL** (Optional but recommended)
   - Click "Reference Variable"
   - Select **Postgres** service → **DATABASE_URL**
   - This is needed for Prisma Client generation

### Step 2: Verify Backend is Running

1. **Go to Railway → handsome-radiance (backend) → Deploy Logs**
2. **Check that the service is running**:
   - Should see: `🚀 Server running on port 3001`
   - Should see: `✅ DATABASE_URL configured`
   - Should see: `🌐 CORS enabled for: https://smartschedule24.com`

3. **If backend is not running**, check for errors in the logs

### Step 3: Test Backend API Directly

Test if the backend is accessible:

1. **Open a browser** and go to: `https://smartschedule24.com/api/health`
2. **You should see JSON** like:
   ```json
   {
     "status": "ok",
     "timestamp": "..."
   }
   ```
3. **If you see HTML or an error**, the backend isn't accessible

### Step 4: Verify Backend Environment Variables

The backend also needs correct CORS settings:

1. **Go to Railway → handsome-radiance → Variables**
2. **Verify/Add these variables**:

   **FRONTEND_URL**
   - Value: `https://smartschedule24.com`
   - Used for CORS configuration

   **WEBAUTHN_RP_ID**
   - Value: `smartschedule24.com`
   - Required for WebAuthn authentication

   **WEBAUTHN_ORIGIN**
   - Value: `https://smartschedule24.com`
   - Required for WebAuthn authentication

### Step 5: Redeploy Frontend

After adding environment variables:

1. **Railway will automatically redeploy** the frontend service
2. **Wait for deployment to complete** (usually 2-5 minutes)
3. **Check deployment logs** for any errors

### Step 6: Test Login Again

1. **Go to**: `https://smartschedule24.com/login`
2. **Try logging in** with test credentials:
   - Email: `student@example.com`
   - Password: `password123`
3. **Check browser console** (F12) for any errors
4. **The error should be gone** if everything is configured correctly

## 🔧 Code Fixes Applied

I've also updated the code to handle this error more gracefully:

1. **AuthProvider.tsx**: Now checks if response is JSON before parsing
2. **webauthn.ts**: Added content-type checking for WebAuthn requests

These changes will show better error messages if the API URL is wrong.

## 📋 Quick Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set to `https://smartschedule24.com/api` in Railway frontend service
- [ ] `NEXT_PUBLIC_EXTERNAL_API_URL` is set to `https://smartschedule24.com` in Railway frontend service
- [ ] Backend service (handsome-radiance) is running and healthy
- [ ] `FRONTEND_URL` is set to `https://smartschedule24.com` in Railway backend service
- [ ] Frontend service has been redeployed after adding variables
- [ ] Can access `https://smartschedule24.com/api/health` and see JSON response
- [ ] Login page no longer shows JSON parsing errors

## 🐛 Troubleshooting

### Still Getting JSON Error?

1. **Check Browser Console** (F12 → Console):
   - Look for the actual API URL being called
   - Verify it's not `localhost:3001`

2. **Check Network Tab** (F12 → Network):
   - Find the failed request
   - Check the Response tab - is it HTML or JSON?
   - Check the Request URL - is it correct?

3. **Verify Environment Variables**:
   - Go to Railway → SmartSchedule → Variables
   - Make sure `NEXT_PUBLIC_API_URL` is exactly: `https://smartschedule24.com/api`
   - Note: Must include `/api` at the end!

4. **Check Backend Logs**:
   - Go to Railway → handsome-radiance → Deploy Logs
   - Look for CORS errors or connection issues

### Backend Returns 404?

If `https://smartschedule24.com/api/health` returns 404:

1. **Check backend route**: Should be `/api/health` (not `/health`)
2. **Check backend is running**: Railway → handsome-radiance → should show "Active"
3. **Check backend port**: Should be 3001 (Railway sets this automatically)

### CORS Errors?

If you see CORS errors in the console:

1. **Verify `FRONTEND_URL`** is set in backend: `https://smartschedule24.com`
2. **Check backend CORS configuration** allows your domain
3. **Redeploy backend** after changing CORS settings

## 🎯 Expected Result

After fixing:

- ✅ No more "Unexpected token" errors
- ✅ Login requests return proper JSON responses
- ✅ Can successfully login with test users
- ✅ WebAuthn authentication works (if configured)

## 📝 Important Notes

1. **Environment Variables**: `NEXT_PUBLIC_*` variables must be set in the **frontend service** (SmartSchedule), not the backend

2. **API URL Format**: 
   - ✅ Correct: `https://smartschedule24.com/api`
   - ❌ Wrong: `https://smartschedule24.com` (missing `/api`)
   - ❌ Wrong: `http://localhost:3001/api` (won't work in production)

3. **Redeployment**: After adding environment variables, Railway automatically redeploys. Wait for it to complete before testing.

4. **Build Time**: Environment variables are baked into the Next.js build, so you must rebuild after adding them.

## 🚀 Next Steps

1. Add the environment variables in Railway
2. Wait for frontend redeployment
3. Test the login page
4. If still having issues, check the troubleshooting section above


