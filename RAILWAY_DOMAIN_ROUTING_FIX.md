# Railway Domain Routing Fix - smartschedule24.com

## 🎯 Problem Summary

Your website shows a Railway "Not Found" error page instead of your application. Based on the images you provided, here are the critical issues:

## 🔍 Issues Identified

### 1. **Port Configuration Mismatch** ✅ FIXED
- **Issue**: Dockerfile exposed port 3000, but Railway uses port 8080
- **Status**: ✅ Fixed in `Dockerfile.prod` - now exposes port 8080 and sets default PORT=8080
- **Action**: Already completed

### 2. **DNS/CNAME Target Verification** ⚠️ NEEDS VERIFICATION
- **Issue**: Cloudflare shows `a0ljd1c5.up.railway.app`, but need to verify this matches Railway
- **Action Required**: Verify the exact subdomain Railway provides

### 3. **Railway "Not Found" Error** ⚠️ MAIN ISSUE
- **Symptom**: Visiting `smartschedule24.com` shows Railway's "Not Found" page
- **Cause**: Railway can't route the domain to your service
- **Possible Reasons**:
  1. DNS hasn't fully propagated
  2. CNAME target doesn't match Railway's subdomain
  3. Domain not properly linked in Railway
  4. Port mismatch (now fixed)

### 4. **Missing Environment Variables** ⚠️ CRITICAL
- **Frontend Service Missing**:
  - `NEXT_PUBLIC_API_URL` - Required for API calls
  - `NEXT_PUBLIC_EXTERNAL_API_URL` - Required for external URLs
  - `DATABASE_URL` - Required for Prisma Client

## ✅ Step-by-Step Fix

### Step 1: Verify Railway Subdomain

1. Go to Railway Dashboard → **SmartSchedule** service
2. Click **Settings** → **Networking** → **Public Networking**
3. Find the domain `smartschedule24.com`
4. **Copy the exact subdomain** shown (should be something like `a0ljd1c5.up.railway.app` or `a01jd1c5.up.railway.app`)
5. **Note**: There might be a typo - verify if it's `a0ljd1c5` (with lowercase 'L') or `a01jd1c5` (with number '1')

### Step 2: Verify Cloudflare DNS Records

1. Go to Cloudflare Dashboard → **DNS** → **Records**
2. Check the CNAME record for `@` (root domain):
   - **Type**: CNAME
   - **Name**: `@` or `smartschedule24.com`
   - **Target**: Should **EXACTLY** match Railway's subdomain (from Step 1)
   - **Proxy Status**: **MUST be ON** (orange cloud) ⚠️ **CRITICAL**
   - **TTL**: Auto

3. If the target doesn't match, **update it**:
   - Click **Edit** on the CNAME record
   - Update **Target** to match Railway's exact subdomain
   - Ensure **Proxy status** is **ON** (orange cloud)
   - Click **Save**

### Step 3: Verify Cloudflare SSL/TLS Settings

1. Go to Cloudflare → **SSL/TLS** → **Overview**
2. Set encryption mode to **Full** (NOT Full Strict) ⚠️ **IMPORTANT**
3. Go to **SSL/TLS** → **Edge Certificates**
4. Ensure **Universal SSL** is enabled
5. Wait 5-10 minutes for SSL to provision

### Step 4: Add Missing Environment Variables in Railway

#### For Frontend Service (SmartSchedule):

1. Go to Railway → **SmartSchedule** service → **Variables** tab
2. Add these variables:

   **NEXT_PUBLIC_API_URL**
   - Value: `https://smartschedule24.com/api`
   - Description: Backend API URL for frontend requests

   **NEXT_PUBLIC_EXTERNAL_API_URL**
   - Value: `https://smartschedule24.com`
   - Description: External API URL for WebAuthn and other services

   **DATABASE_URL**
   - Click **"New Variable"** → **"Reference Variable"**
   - Select **Postgres** service → **DATABASE_URL**
   - This shares the database connection with the frontend (needed for Prisma)

### Step 5: Verify Railway Domain Configuration

1. Go to Railway → **SmartSchedule** service → **Settings** → **Networking**
2. Under **Public Networking**, verify:
   - Domain `smartschedule24.com` shows ✅ green checkmark
   - Port shows **8080** (this is correct after our fix)
   - Status shows "Cloudflare proxy detected"

3. If domain shows "Waiting for DNS update":
   - Wait 5-30 minutes for DNS propagation
   - Verify Cloudflare DNS records are correct (Step 2)
   - Check that Cloudflare proxy is ON

### Step 6: Wait for DNS Propagation

DNS changes can take time:
- **Usually**: 5-30 minutes
- **Maximum**: Up to 72 hours
- **Check propagation**: Use `nslookup smartschedule24.com` or online DNS checker

### Step 7: Test the Application

After DNS propagates:

1. Visit `https://smartschedule24.com`
2. It should load your application (not the Railway "Not Found" page)
3. If still "Not Found", check Railway logs:
   - Go to Railway → **SmartSchedule** → **Deploy Logs**
   - Look for errors or warnings
   - Verify the service is running and healthy

## 🔍 Troubleshooting Checklist

### Still Getting "Not Found" Error?

- [ ] Verified Railway subdomain matches Cloudflare CNAME target exactly
- [ ] Cloudflare proxy status is **ON** (orange cloud) for CNAME record
- [ ] Cloudflare SSL/TLS mode is set to **Full** (not Full Strict)
- [ ] Railway service is running and healthy (check logs)
- [ ] Port is set to 8080 in Railway (should be automatic)
- [ ] Environment variables are set in Railway frontend service
- [ ] Waited at least 30 minutes for DNS propagation
- [ ] Checked DNS propagation with `nslookup smartschedule24.com`

### Service Running but Domain Not Found?

- [ ] DNS hasn't propagated yet - Wait longer (can take 24-48 hours)
- [ ] Wrong CNAME target - Verify exact subdomain from Railway
- [ ] Cloudflare proxy is OFF - Must be ON (orange cloud)
- [ ] SSL/TLS mode is Full Strict - Should be **Full**
- [ ] Domain not properly linked in Railway - Check Settings → Networking

### Application Loads but Shows Errors?

- [ ] Check browser console for errors
- [ ] Verify `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Verify backend service is running and accessible
- [ ] Check Railway logs for both frontend and backend services

## 📋 Current Configuration Summary

### Dockerfile.prod Changes Made:
- ✅ Changed EXPOSE from 3000 to 8080
- ✅ Set default PORT=8080 environment variable
- ✅ Updated health check to use PORT env var

### What Still Needs to Be Done:
1. ⚠️ Verify Railway subdomain matches Cloudflare CNAME
2. ⚠️ Add missing environment variables in Railway
3. ⚠️ Wait for DNS propagation
4. ⚠️ Test the application

## 🎯 Expected Result

After completing these steps:
- ✅ `https://smartschedule24.com` loads your application
- ✅ No more Railway "Not Found" error
- ✅ Application connects to backend API
- ✅ All features work correctly

## 📞 Next Steps

1. **Immediate**: Verify Railway subdomain and update Cloudflare CNAME if needed
2. **Immediate**: Add missing environment variables in Railway
3. **Wait**: Allow 30 minutes for DNS propagation
4. **Test**: Visit `https://smartschedule24.com` and verify it works

If issues persist after following all steps, check Railway logs for specific error messages.


