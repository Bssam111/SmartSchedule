# Quick Start: Deploy to smartschedule24.com

**TL;DR**: Your domain is on GoDaddy, but you need a hosting provider to run the app. Here are your options:

## 🚀 Fastest Option: Railway (Recommended for Beginners)

1. **Sign up**: [railway.app](https://railway.app)
2. **Create project** → Connect GitHub repo
3. **Add services**:
   - PostgreSQL database
   - Redis cache
   - Backend (from `backend/` folder)
   - Frontend (from `smart-schedule/` folder)
4. **Set environment variables** (copy from `env.production.template`)
5. **Connect domain**: Railway dashboard → Custom Domain → `smartschedule24.com`
6. **Update GoDaddy DNS**: Railway will give you instructions

**Cost**: ~$5-20/month | **Time**: 30 minutes

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

