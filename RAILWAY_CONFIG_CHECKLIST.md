# Railway Configuration Checklist

## ✅ Current Status Check

Based on your screenshots, here's what needs to be verified and fixed:

### 🔴 CRITICAL ISSUES TO FIX:

#### 1. **Backend Service ("handsome-radiance")**

**Current Configuration (from screenshots):**
- Dockerfile Path: `/backend/Dockerfile.prod` ❌ (WRONG - this is absolute)

**Correct Configuration:**
- **Root Directory**: `backend` (no leading slash)
- **Dockerfile Path**: `Dockerfile.prod` (relative to Root Directory, NOT absolute)

**How to Fix:**
1. Go to Railway Dashboard → "handsome-radiance" service → Settings
2. In "Source" section, click "Add Root Directory"
3. Set Root Directory to: `backend` (just `backend`, no slash)
4. Go to "Build" section
5. Set Dockerfile Path to: `Dockerfile.prod` (NOT `/backend/Dockerfile.prod`)
6. **SAVE** settings

#### 2. **Frontend Service ("SmartSchedule")**

**Current Configuration (from screenshots):**
- Dockerfile Path: `/smart-schedule/Dockerfile.prod` ❌ (WRONG - this is absolute)

**Correct Configuration:**
- **Root Directory**: `smart-schedule` (no leading slash)
- **Dockerfile Path**: `Dockerfile.prod` (relative to Root Directory, NOT absolute)

**How to Fix:**
1. Go to Railway Dashboard → "SmartSchedule" service → Settings
2. In "Source" section, click "Add Root Directory"
3. Set Root Directory to: `smart-schedule` (just `smart-schedule`, no slash)
4. Go to "Build" section
5. Set Dockerfile Path to: `Dockerfile.prod` (NOT `/smart-schedule/Dockerfile.prod`)
6. **SAVE** settings

---

## 📋 Complete Verification Checklist

### Backend Service ("handsome-radiance")
- [ ] Root Directory is set to: `backend`
- [ ] Dockerfile Path is set to: `Dockerfile.prod` (relative, not absolute)
- [ ] Builder is set to: `Dockerfile`
- [ ] Environment variables are configured (DATABASE_URL, JWT_SECRET, PORT, REDIS_URL, etc.)
- [ ] Port is set to: `3001` (or whatever your backend uses)

### Frontend Service ("SmartSchedule")
- [ ] Root Directory is set to: `smart-schedule`
- [ ] Dockerfile Path is set to: `Dockerfile.prod` (relative, not absolute)
- [ ] Builder is set to: `Dockerfile`
- [ ] Environment variables are configured (NEXT_PUBLIC_API_URL, DATABASE_URL, etc.)
- [ ] Port is set to: `3000` (or whatever your frontend uses)

### Database Services
- [ ] PostgreSQL service is running and healthy
- [ ] Redis service is running and healthy
- [ ] Both services have volumes attached

### Networking
- [ ] Frontend service has custom domain: `smartschedule24.com`
- [ ] DNS is configured correctly

---

## 🎯 Key Rule to Remember

**When Root Directory is set:**
- Dockerfile Path = **RELATIVE** path (e.g., `Dockerfile.prod`)
- Railway will look for the Dockerfile inside the Root Directory

**When Root Directory is NOT set:**
- Dockerfile Path = **ABSOLUTE** path from repo root (e.g., `/backend/Dockerfile.prod`)
- Railway will look for the Dockerfile from the repository root

**For your monorepo, you MUST set Root Directory for each service!**

---

## 🔍 How to Verify It's Working

After fixing the configuration:

1. **Save all settings** in Railway dashboard
2. **Trigger a new deployment** (or wait for auto-deploy)
3. **Check the build logs**:
   - Should see: "Building Dockerfile: Dockerfile.prod"
   - Should NOT see: "Dockerfile 'Dockerfile.prod' does not exist"
4. **Watch the deployment stages**:
   - Initialization ✅
   - Build ✅
   - Deploy ✅
   - Post-deploy ✅

---

## 🚨 Common Mistakes to Avoid

1. ❌ Using absolute paths when Root Directory is set
2. ❌ Forgetting to click "Save" after changing settings
3. ❌ Setting Root Directory with leading slash (e.g., `/backend` instead of `backend`)
4. ❌ Not setting Root Directory at all for monorepo services
5. ❌ Setting Dockerfile Path to absolute when Root Directory is set

---

## 📞 Still Having Issues?

If deployments still fail after fixing the above:

1. Check the build logs in Railway dashboard
2. Verify that `Dockerfile.prod` files exist in:
   - `backend/Dockerfile.prod`
   - `smart-schedule/Dockerfile.prod`
3. Make sure all files are committed and pushed to GitHub
4. Check that `railway.toml` files exist in both directories

