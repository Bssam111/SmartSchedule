# SmartSchedule Deployment Guide

Complete guide for deploying SmartSchedule to production at `smartschedule24.com`.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Option 1: VPS Deployment (DigitalOcean, AWS EC2, etc.)](#option-1-vps-deployment)
5. [Option 2: Platform as a Service (Railway, Render, etc.)](#option-2-platform-as-a-service)
6. [DNS Configuration](#dns-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Production Deployment Steps](#production-deployment-steps)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Overview

SmartSchedule consists of:
- **Frontend**: Next.js 15 application (port 3000)
- **Backend**: Express/TypeScript API (port 3001)
- **Database**: PostgreSQL
- **Cache**: Redis (for rate limiting & sessions)
- **Reverse Proxy**: Nginx (HTTPS termination)

Your domain `smartschedule24.com` is registered with GoDaddy, but you'll need to host the application on a cloud provider.

---

## Prerequisites

- Domain name: `smartschedule24.com` (GoDaddy)
- Cloud hosting account (choose one):
  - **VPS**: DigitalOcean ($6-12/month), Linode, Vultr
  - **PaaS**: Railway (~$5-20/month), Render (free tier available)
  - **Cloud**: AWS EC2, Google Cloud Run, Azure
- Basic command-line knowledge
- SSH access to your server (for VPS option)

---

## Deployment Options

### Quick Comparison

| Option | Cost | Complexity | Best For |
|--------|------|------------|----------|
| **VPS (DigitalOcean)** | $6-12/month | Medium | Full control, production |
| **Railway** | $5-20/month | Low | Quick deployment |
| **Render** | Free-$7/month | Low | Cost-effective start |
| **AWS EC2** | $10-30/month | High | Enterprise needs |

---

## Option 1: VPS Deployment

Recommended for production with full control. Steps below use DigitalOcean as an example.

### Step 1: Create VPS Droplet

1. Sign up at [DigitalOcean](https://www.digitalocean.com)
2. Create a new Droplet:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month, 2GB RAM minimum)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password

### Step 2: Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Update system and install Docker:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Add non-root user (optional but recommended)
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy
```

### Step 3: Clone Repository

```bash
# Install Git
apt install git -y

# Clone your repository
cd /opt
git clone https://github.com/YOUR_USERNAME/SmartSchedule.git
cd SmartSchedule

# Or upload files via SCP/SFTP
```

### Step 4: Configure Environment Variables

```bash
# Copy example file
cp .env.production.example .env.production

# Edit with secure values
nano .env.production
```

**Critical values to change:**
- `POSTGRES_PASSWORD`: Generate strong password (32+ characters)
- `JWT_SECRET`: Generate random string (at least 32 characters)
- `REDIS_PASSWORD`: Generate strong password

Generate secure passwords:

```bash
# Generate random passwords
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD
```

### Step 5: Configure DNS (GoDaddy)

1. Log into [GoDaddy](https://www.godaddy.com)
2. Go to **My Products** → **Domains** → `smartschedule24.com`
3. Click **DNS** or **Manage DNS**
4. Update DNS records:

```
Type    Name    Value              TTL
A       @       YOUR_SERVER_IP     600
A       www     YOUR_SERVER_IP     600
```

**Example:**
- If your server IP is `123.45.67.89`, set:
  - A record `@` → `123.45.67.89`
  - A record `www` → `123.45.67.89`

5. **Wait 5-30 minutes** for DNS propagation

Verify DNS:

```bash
dig smartschedule24.com
# or
nslookup smartschedule24.com
```

### Step 6: Setup SSL Certificate (Let's Encrypt)

Before starting containers, obtain SSL certificate:

```bash
# Install Certbot
apt install certbot -y

# Stop nginx if running
docker compose -f docker-compose.prod.yml down

# Obtain certificate (replace with your email)
certbot certonly --standalone -d smartschedule24.com -d www.smartschedule24.com --email your-email@example.com --agree-tos --non-interactive

# Certificates will be in:
# /etc/letsencrypt/live/smartschedule24.com/fullchain.pem
# /etc/letsencrypt/live/smartschedule24.com/privkey.pem

# Copy certificates to nginx/ssl
cp /etc/letsencrypt/live/smartschedule24.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/smartschedule24.com/privkey.pem nginx/ssl/

# Set proper permissions
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem
```

**Auto-renewal setup:**

```bash
# Create renewal script
cat > /etc/cron.monthly/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet --deploy-hook "docker compose -f /opt/SmartSchedule/docker-compose.prod.yml restart nginx"
EOF

chmod +x /etc/cron.monthly/renew-ssl.sh
```

### Step 7: Build and Start Services

```bash
cd /opt/SmartSchedule

# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 8: Run Database Migrations

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# (Optional) Seed initial data
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### Step 9: Verify Deployment

1. Visit `https://smartschedule24.com`
2. Check API health: `https://smartschedule24.com/api/health`
3. Test login functionality

---

## Option 2: Platform as a Service

Easier deployment with less server management.

### Railway

1. Sign up at [Railway](https://railway.app)
2. Create new project → **Deploy from GitHub**
3. Configure services:
   - **Backend**: Point to `backend/` directory
   - **Frontend**: Point to `smart-schedule/` directory
   - **Database**: Add PostgreSQL service
   - **Redis**: Add Redis service
4. Set environment variables (from `.env.production.example`)
5. Railway automatically handles:
   - SSL certificates
   - Domain configuration
   - Scaling

### Render

1. Sign up at [Render](https://render.com)
2. Create **Web Service** for backend
3. Create **Web Service** for frontend
4. Create **PostgreSQL** database
5. Create **Redis** instance
6. Configure environment variables
7. Connect custom domain in Render dashboard

**Note**: Render requires updating Nginx config or using their reverse proxy.

---

## DNS Configuration

### GoDaddy DNS Settings

1. **Log into GoDaddy**
   - Go to [godaddy.com](https://www.godaddy.com)
   - Click **My Products** → **Domains**
   - Click `smartschedule24.com` → **DNS** or **Manage DNS**

2. **Add/Update A Records**

   For VPS deployment:
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   TTL: 600 (10 minutes)
   
   Type: A
   Name: www
   Value: YOUR_SERVER_IP
   TTL: 600
   ```

   For PaaS (if they provide IP):
   ```
   Type: A
   Name: @
   Value: PAAS_PROVIDED_IP
   TTL: 600
   ```

   Or use CNAME for subdomain routing (PaaS often provides):
   ```
   Type: CNAME
   Name: @
   Value: YOUR_PAAS_HOSTNAME
   TTL: 600
   ```

3. **Save Changes**
   - Click **Save** or **Add Record**
   - Wait 5-30 minutes for DNS propagation

4. **Verify DNS Propagation**
   ```bash
   # Check from your computer
   nslookup smartschedule24.com
   dig smartschedule24.com
   
   # Or use online tools
   # https://www.whatsmydns.net
   ```

---

## SSL Certificate Setup

### Automatic (Let's Encrypt with Certbot)

For VPS deployments, use Certbot (recommended):

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain certificate
certbot certonly --standalone \
  -d smartschedule24.com \
  -d www.smartschedule24.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Copy certificates
cp /etc/letsencrypt/live/smartschedule24.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/smartschedule24.com/privkey.pem nginx/ssl/
```

### Manual Certificate Upload

If you have certificates from another provider:

1. Place certificates in `nginx/ssl/`:
   - `fullchain.pem` (certificate chain)
   - `privkey.pem` (private key)

2. Update permissions:
   ```bash
   chmod 644 nginx/ssl/fullchain.pem
   chmod 600 nginx/ssl/privkey.pem
   ```

3. Restart Nginx:
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

---

## Production Deployment Steps

### Quick Start Checklist

- [ ] Choose hosting provider (VPS or PaaS)
- [ ] Set up server/hosting account
- [ ] Clone repository or upload code
- [ ] Configure `.env.production` with secure values
- [ ] Configure DNS records in GoDaddy
- [ ] Obtain SSL certificate
- [ ] Build and start Docker containers
- [ ] Run database migrations
- [ ] Verify deployment
- [ ] Set up monitoring and backups

### Detailed Commands

```bash
# 1. Navigate to project
cd /opt/SmartSchedule

# 2. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with secure values

# 3. Build images
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Start services
docker compose -f docker-compose.prod.yml up -d

# 5. Check logs
docker compose -f docker-compose.prod.yml logs -f

# 6. Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 7. Check service health
curl https://smartschedule24.com/api/health
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=100

# Check backend health
curl https://smartschedule24.com/api/health
```

### Backup Database

```bash
# Create backup script
cat > /opt/SmartSchedule/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

docker compose -f /opt/SmartSchedule/docker-compose.prod.yml exec -T database \
  pg_dump -U smartschedule smartschedule_prod | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/SmartSchedule/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/SmartSchedule/backup.sh") | crontab -
```

### Update Application

```bash
cd /opt/SmartSchedule

# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Monitor Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker resources
docker stats

# View container logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Troubleshooting

### Domain Not Resolving

```bash
# Check DNS propagation
dig smartschedule24.com
nslookup smartschedule24.com

# Verify DNS records in GoDaddy are correct
# Wait up to 48 hours for full propagation
```

### SSL Certificate Issues

```bash
# Test certificate
openssl s_client -connect smartschedule24.com:443 -servername smartschedule24.com

# Renew certificate
certbot renew

# Check Nginx SSL config
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Database Connection Errors

```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs database

# Test database connection
docker compose -f docker-compose.prod.yml exec database psql -U smartschedule -d smartschedule_prod

# Verify DATABASE_URL in .env.production
```

### Application Not Starting

```bash
# Check all logs
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Verify environment variables
docker compose -f docker-compose.prod.yml exec backend env | grep DATABASE_URL
```

### Port Conflicts

```bash
# Check what's using ports
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Stop conflicting services or change ports in docker-compose.prod.yml
```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET (32+ characters)
- [ ] Generated strong database password
- [ ] Enabled HTTPS/SSL
- [ ] Configured firewall (only ports 80, 443 open)
- [ ] Set up regular backups
- [ ] Enabled automatic security updates
- [ ] Restricted database access (only from backend container)
- [ ] Configured rate limiting
- [ ] Set proper file permissions

---

## Support & Resources

- **Docker Docs**: https://docs.docker.com
- **Let's Encrypt**: https://letsencrypt.org
- **Nginx Docs**: https://nginx.org/en/docs
- **GoDaddy DNS Help**: https://www.godaddy.com/help

---

## Next Steps

After deployment:

1. **Set up monitoring** (UptimeRobot, Pingdom)
2. **Configure backups** (automated daily)
3. **Set up alerts** (email/SMS for downtime)
4. **Performance optimization** (CDN, caching)
5. **Security hardening** (firewall, fail2ban)

---

**Questions?** Check logs, verify DNS, and ensure all environment variables are set correctly.

