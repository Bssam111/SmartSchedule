# Quick Start: Deploy to smartschedule24.com

**TL;DR**: Your domain is on GoDaddy, but you need a hosting provider to run the app. Here are your options:

## 🚀 Fastest Option: Railway (Recommended for Beginners)

1. **Sign up**: [railway.app](https://railway.app)
2. **Create project** → Connect GitHub repo
3. **Add services**:
   - **PostgreSQL database**: Click "New" → "Database" → "PostgreSQL"
   - **Redis cache**: Click "New" → "Database" → "Redis"
   - **Backend service**: Click "New" → "GitHub Repo" → Select your repo
   - **Frontend service**: Click "New" → "GitHub Repo" → Select your repo (again)

4. **Configure Backend Service** (⚠️ CRITICAL STEP):
   - Click on the backend service ("handsome-radiance")
   - Go to **Settings** tab → **Build** section
   - **Option A (Easiest - Use Railway's suggestion)**: 
     - Set **Dockerfile Path** to: `/backend/Dockerfile.prod` (Railway should suggest this)
     - Leave Root Directory empty
   - **Option B (Recommended for monorepos)**:
     - Go to **Source** section → Click **"Add Root Directory"** → Set to: `backend`
     - Go to **Build** section → Set **Dockerfile Path** to: `Dockerfile.prod` (relative, not absolute)
   - **Save** the settings (important!)
   - Go to **Variables** tab and add all environment variables (see below)

5. **Configure Frontend Service** (⚠️ CRITICAL STEP):
   - Click on the frontend service ("SmartSchedule")
   - Go to **Settings** tab → **Build** section
   - **Option A (Easiest - Use Railway's suggestion)**:
     - Set **Dockerfile Path** to: `/smart-schedule/Dockerfile.prod` (Railway should suggest this)
     - Leave Root Directory empty
   - **Option B (Recommended for monorepos)**:
     - Go to **Source** section → Click **"Add Root Directory"** → Set to: `smart-schedule`
     - Go to **Build** section → Set **Dockerfile Path** to: `Dockerfile.prod` (relative, not absolute)
   - **Save** the settings (important!)
   - Go to **Variables** tab and add all environment variables (see below)

6. **Set Environment Variables** (for both services):
   - Copy variables from `env.production.template`
   - **Backend needs**: `DATABASE_URL` (from PostgreSQL service), `REDIS_URL` (from Redis service), `JWT_SECRET`, `PORT=3001`, etc.
   - **Frontend needs**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_EXTERNAL_API_URL`, `DATABASE_URL` (for Prisma), etc.
   - **Important**: Use Railway's service references for `DATABASE_URL` and `REDIS_URL` (Railway provides these automatically)

7. **Connect domain**: 
   - Click on Frontend service → **Settings** → **Networking**
   - Click **Generate Domain** or **Add Custom Domain** → `smartschedule24.com`
   - Railway will provide DNS instructions

8. **Update GoDaddy DNS**: 
   - Follow Railway's DNS instructions (usually CNAME records)
   - Wait 5-30 minutes for DNS propagation

**Cost**: ~$5-20/month | **Time**: 30 minutes

### ⚠️ Troubleshooting Railway Deployment

**Error: "Dockerfile 'Dockerfile.prod' does not exist"**

**If Railway is suggesting absolute paths** (like `/backend/Dockerfile.prod`):
- ✅ **Use Railway's suggestion**: Select `/backend/Dockerfile.prod` for backend and `/smart-schedule/Dockerfile.prod` for frontend
- ✅ **OR set Root Directory** and use relative paths:
  - Set Root Directory to `backend` → Dockerfile Path: `Dockerfile.prod`
  - Set Root Directory to `smart-schedule` → Dockerfile Path: `Dockerfile.prod`

**Important Rule:**
- **If Root Directory is NOT set**: Use absolute paths like `/backend/Dockerfile.prod` ✅
- **If Root Directory IS set**: Use relative paths like `Dockerfile.prod` ✅
- **Never mix them**: Don't use absolute paths when Root Directory is set!

**Error: "Error creating build plan with Railway"**
- ✅ **Solution**: Make sure you set the **Root Directory** correctly:
  - Backend: `backend`
  - Frontend: `smart-schedule`
- ✅ **Solution**: Verify **Dockerfile Path** is set to `Dockerfile.prod`
- ✅ **Solution**: The `railway.toml` files in each directory should help, but you still need to set Root Directory in Railway dashboard

**Build fails during Docker build**
- Check that `Dockerfile.prod` exists in `backend/` and `smart-schedule/` directories
- Verify all required files are committed to GitHub
- Check build logs in Railway dashboard for specific errors
- Make sure Root Directory is set BEFORE deploying (this is the most common issue!)

---

## 🖥️ Most Control: DigitalOcean VPS

1. **Create Droplet**: Ubuntu 22.04, $12/month (2GB RAM)
2. **SSH into server**: `ssh root@YOUR_IP`
3. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   apt install docker-compose-plugin -y
   ```
4. **Clone repo**: `cd /opt && git clone YOUR_REPO_URL`
5. **Setup environment**:
   ```bash
   cd SmartSchedule
   cp env.production.template .env.production
   nano .env.production  # Edit with secure passwords
   ```
6. **Update GoDaddy DNS**:
   - A record `@` → YOUR_SERVER_IP
   - A record `www` → YOUR_SERVER_IP
7. **Get SSL certificate**:
   ```bash
   apt install certbot -y
   certbot certonly --standalone -d smartschedule24.com -d www.smartschedule24.com
   cp /etc/letsencrypt/live/smartschedule24.com/*.pem nginx/ssl/
   ```
8. **Deploy**:
   ```bash
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml up -d
   docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

**Cost**: $12/month | **Time**: 1-2 hours

---

## 🔧 GoDaddy DNS Configuration

GoDaddy is just your domain registrar. Point it to your hosting:

1. Login to [GoDaddy](https://godaddy.com)
2. Go to **My Products** → **Domains** → `smartschedule24.com`
3. Click **DNS** or **Manage DNS**
4. Add/Edit records:

   **For VPS (DigitalOcean, etc.)**:
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   
   Type: A  
   Name: www
   Value: YOUR_SERVER_IP
   ```

   **For PaaS (Railway, Render, etc.)**:
   Follow their domain connection instructions (usually involves CNAME or their DNS servers)

5. **Wait 5-30 minutes** for DNS to propagate

---

## 📋 Checklist

- [ ] Choose hosting (Railway = easy, DigitalOcean = control)
- [ ] Set up hosting account
- [ ] Configure environment variables
- [ ] Update GoDaddy DNS
- [ ] Get SSL certificate (automatic on Railway, manual on VPS)
- [ ] Deploy application
- [ ] Test: Visit `https://smartschedule24.com`

---

## 🔒 Generate Secure Passwords

```bash
# On Linux/Mac or in server terminal:
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for POSTGRES_PASSWORD  
openssl rand -base64 32  # Use for REDIS_PASSWORD
```

---

## ❓ Need More Details?

See full guide: `DEPLOYMENT.md`

**Common Issues:**
- **Domain not working?** Wait 30 minutes for DNS, then check with `nslookup smartschedule24.com`
- **SSL errors?** Make sure certificates are in `nginx/ssl/` folder
- **Can't connect?** Check firewall allows ports 80 and 443

---

**Next Steps**: Choose an option above and follow the steps. The full `DEPLOYMENT.md` has troubleshooting and advanced configurations.

