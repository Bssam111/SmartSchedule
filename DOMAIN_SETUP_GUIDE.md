# Domain Setup Guide for smartschedule24.com

## ⚠️ CRITICAL: GoDaddy Limitation

**GoDaddy does NOT support CNAME records for root domains (@).** This is a GoDaddy limitation, not a Railway issue.

According to Railway documentation, GoDaddy is one of the DNS providers that doesn't support CNAME flattening or dynamic ALIAS records at the root level.

## 🎯 Current Issues

1. **GoDaddy Limitation**: Cannot use CNAME for "@" (root domain) in GoDaddy
2. **DNS Records Mismatch**: Railway wants `a01jd1c5.up.railway.app` but GoDaddy has `a0ljd1c5.up.railway.app`
3. **Domain Forwarding Conflict**: Forwarding may interfere with DNS
4. **Port Mismatch**: Railway shows port 8080 but frontend uses 3000

## ✅ Solution: Use Cloudflare Nameservers (RECOMMENDED)

Since GoDaddy doesn't support CNAME for root domains, the best solution is to **change your domain's nameservers to Cloudflare**. This allows you to use CNAME records for the root domain.

### Option A: Switch to Cloudflare Nameservers (RECOMMENDED) ⭐

This is the easiest and most reliable solution.

#### Step 1: Create Free Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com) and sign up (free)
2. Add your domain `smartschedule24.com`
3. Cloudflare will scan your existing DNS records
4. Select the **Free plan** (no credit card needed)

#### Step 2: Update Nameservers in GoDaddy

1. In Cloudflare, you'll see two nameservers (e.g., `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`)
2. Go to GoDaddy → Domain Settings → Nameservers
3. Change from "GoDaddy Nameservers" to "Custom Nameservers"
4. Enter the two Cloudflare nameservers
5. Save (can take 24-48 hours, usually faster)

#### Step 3: Configure DNS in Cloudflare

Once nameservers are updated:

1. In Cloudflare dashboard → DNS → Records
2. **Add CNAME for root domain:**
   - Type: `CNAME`
   - Name: `@` (or `smartschedule24.com`)
   - Target: `a01jd1c5.up.railway.app` (from Railway)
   - Proxy status: **ON** (orange cloud) ⚠️ **IMPORTANT**
   - TTL: Auto
3. **Add CNAME for www:**
   - Type: `CNAME`
   - Name: `www`
   - Target: `@` (or `smartschedule24.com`)
   - Proxy status: **ON** (orange cloud)
   - TTL: Auto

#### Step 4: Configure SSL in Cloudflare

1. Go to SSL/TLS → Overview
2. Set encryption mode to **Full** (NOT Full Strict)
3. Go to SSL/TLS → Edge Certificates
4. Enable **Universal SSL**

#### Step 5: Update Railway Port

1. Go to Railway → SmartSchedule service → Settings
2. Find "Networking" → "Public Networking"
3. Change port from **8080** to **3000**
4. Save

### Option B: Use www Subdomain Only (Workaround)

If you don't want to switch to Cloudflare, you can use only the `www` subdomain:

1. In GoDaddy, keep the A records for "@" (root domain) pointing to GoDaddy IPs
2. Update the "www" CNAME to point to `a01jd1c5.up.railway.app`
3. Set up domain forwarding: `smartschedule24.com` → `https://www.smartschedule24.com` (301 redirect)
4. Users will be redirected from root to www automatically

**Limitation**: Root domain won't work directly, only www will work.

## ✅ Step-by-Step Fix (If Using Cloudflare)

1. Go to Railway → SmartSchedule service → Settings
2. Find "Networking" → "Public Networking" section
3. Click "Update your target port" or find the port setting
4. Change port from **8080** to **3000**
5. Save changes

### Step 2: Configure DNS in Cloudflare

#### 2.1 Add CNAME Record for Root Domain

1. In Cloudflare dashboard → DNS → Records
2. Click "Add record"
3. Configure:
   - **Type**: `CNAME`
   - **Name**: `@` (or `smartschedule24.com`)
   - **Target**: `a01jd1c5.up.railway.app` (⚠️ **EXACT value from Railway**, no trailing dot)
   - **Proxy status**: **ON** (orange cloud) ⚠️ **CRITICAL - Must be ON**
   - **TTL**: Auto
4. Click "Save"

#### 2.2 Add CNAME Record for www

1. In Cloudflare dashboard → DNS → Records
2. Click "Add record"
3. Configure:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `@` (Cloudflare will auto-convert to your root domain)
   - **Proxy status**: **ON** (orange cloud)
   - **TTL**: Auto
4. Click "Save"

#### 2.3 Configure SSL/TLS

1. Go to SSL/TLS → Overview
2. Set encryption mode to **Full** (NOT Full Strict) ⚠️ **IMPORTANT**
3. Go to SSL/TLS → Edge Certificates
4. Enable **Universal SSL**
5. Wait a few minutes for SSL to provision

### Step 3: Verify DNS Propagation

1. Wait 5-10 minutes after making changes
2. Check Railway dashboard - it should detect the DNS record
3. Test the domain:
   ```bash
   # Check CNAME record
   nslookup smartschedule24.com
   
   # Check www subdomain
   nslookup www.smartschedule24.com
   ```

### Step 4: Test the Application

1. After DNS propagates (can take up to 72 hours, usually 5-30 minutes):
   - Visit `https://smartschedule24.com`
   - Visit `https://www.smartschedule24.com`
2. Both should work and show your application

## 📋 DNS Records Summary (What Should Be in Cloudflare)

| Type | Name | Target | Proxy | Notes |
|------|------|--------|-------|-------|
| CNAME | @ | `a01jd1c5.up.railway.app` | ON (Orange) | Root domain → Railway |
| CNAME | www | `@` | ON (Orange) | www subdomain → Root domain |

**Important**: 
- Proxy status must be **ON** (orange cloud) for both records
- SSL/TLS mode must be **Full** (not Full Strict)

## ⚠️ Important Notes

1. **GoDaddy Limitation**: GoDaddy does NOT support CNAME records for root domains. You MUST either:
   - **Option A (Recommended)**: Switch to Cloudflare nameservers (free, easy, supports CNAME for root)
   - **Option B**: Use only www subdomain and forward root domain to www

2. **Cloudflare Proxy**: 
   - ✅ **MUST be ON** (orange cloud) - This enables CNAME flattening
   - ❌ If proxy is OFF (grey cloud), CNAME for root won't work

3. **SSL/TLS Mode**: 
   - ✅ Use **Full** mode (not Full Strict)
   - ❌ Full Strict won't work with Railway

4. **Subdomain Mismatch**: Make sure you're using the **exact** subdomain Railway provides (`a01jd1c5`, not `a0ljd1c5`)

4. **Port Configuration**: Railway must be configured to use port **3000** (not 8080) for the frontend service

5. **Domain Forwarding**: Remove forwarding during DNS setup, then re-add if needed after DNS is working

## 🔍 Troubleshooting

### Railway Still Shows "Waiting for DNS update"

- Wait 5-30 minutes for DNS propagation (can take up to 72 hours)
- Verify nameservers are pointing to Cloudflare (check with `nslookup -type=NS smartschedule24.com`)
- Verify the CNAME record value is **exactly** `a01jd1c5.up.railway.app` (no trailing dot, correct subdomain)
- Check that Cloudflare proxy is **ON** (orange cloud) for the CNAME record
- Check that port is set to 3000 in Railway settings

### Domain Shows "404 Not Found"

- Check Railway service is running
- Verify port is 3000 in Railway settings
- Check Railway logs for errors

### Domain Shows GoDaddy Default Page

- Nameservers haven't switched to Cloudflare yet (wait 24-48 hours)
- DNS hasn't propagated yet (wait longer)
- Still using GoDaddy nameservers (check with `nslookup -type=NS smartschedule24.com`)

## ✅ Success Criteria

- ✅ Railway dashboard shows "DNS configured" or similar
- ✅ `https://smartschedule24.com` loads your application
- ✅ `https://www.smartschedule24.com` loads your application
- ✅ No 404 or GoDaddy default page

