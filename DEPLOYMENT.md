# SmartSchedule Deployment Guide

## Overview

This guide covers deploying the SmartSchedule application to GoDaddy VPS with SSL, security hardening, and production-ready configuration.

## Architecture Decision

**Chosen Path: GoDaddy VPS (Option B)**

**Justification:**
- Full control over Node.js/PostgreSQL stack
- Better performance for API-heavy applications
- Enhanced security posture with custom configurations
- Docker support for consistent deployments
- Better suited for the Express.js + Prisma + PostgreSQL stack

## Prerequisites

- GoDaddy VPS with Ubuntu 20.04+ LTS
- Domain name configured in GoDaddy DNS
- SSH access to VPS
- Basic knowledge of Linux commands

## Step 1: VPS Setup and Security

### 1.1 Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create deployment user
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Configure SSH (disable root login, use key-based auth)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no, PasswordAuthentication no
sudo systemctl restart ssh

# Install fail2ban for security
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 1.2 Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 2: Install Dependencies

### 2.1 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2.2 Install Node.js and PM2

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

## Step 3: Database Setup

### 3.1 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Configure PostgreSQL
sudo -u postgres psql
```

```sql
-- Create database and user
CREATE DATABASE smartschedule;
CREATE USER smartschedule_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE smartschedule TO smartschedule_user;
\q
```

### 3.2 Configure PostgreSQL Security

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ensure only local connections: local all all md5

sudo systemctl restart postgresql
```

## Step 4: Application Deployment

### 4.1 Clone and Setup Application

```bash
# Switch to deploy user
su - deploy

# Clone repository
git clone https://github.com/your-username/smartschedule.git
cd smartschedule

# Install dependencies
npm install

# Build application
npm run build
```

### 4.2 Environment Configuration

```bash
# Create production environment file
cp backend/env.example .env.production

# Edit environment variables
nano .env.production
```

**Production Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://smartschedule_user:your_secure_password@localhost:5432/smartschedule?schema=public"

# JWT Security (GENERATE NEW SECRETS!)
JWT_SECRET="your-super-secret-jwt-key-256-bits-minimum"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-256-bits-minimum"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
JWT_ISSUER="smartschedule-api"
JWT_AUDIENCE="smartschedule-client"

# Server
PORT=3001
NODE_ENV="production"

# CORS & Security
FRONTEND_URL="https://yourdomain.com"
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
HSTS_MAX_AGE=31536000
CSP_REPORT_URI="https://yourdomain.com/csp-report"

# File Upload
MAX_FILE_SIZE="5mb"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf,text/plain"

# Admin IP Whitelist
ADMIN_IP_WHITELIST="your.office.ip,backup.server.ip"

# Logging
LOG_LEVEL="info"
SECURITY_LOG_RETENTION_DAYS="90"
```

### 4.3 Database Migration

```bash
# Run database migrations
cd backend
npx prisma migrate deploy
npx prisma generate

# Seed initial data (if needed)
npm run db:seed
```

## Step 5: SSL Certificate Setup

### 5.1 Install Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/smartschedule
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### 5.3 Enable Site and Get SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smartschedule /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test SSL renewal
sudo certbot renew --dry-run
```

## Step 6: Application Startup

### 6.1 Start Backend with PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**PM2 Configuration:**

```javascript
module.exports = {
  apps: [
    {
      name: 'smartschedule-backend',
      script: './backend/dist/server.js',
      cwd: '/home/deploy/smartschedule',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'smartschedule-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/smartschedule/smart-schedule',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
```

### 6.2 Start Applications

```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs
```

## Step 7: Monitoring and Maintenance

### 7.1 Setup Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/smartschedule
```

**Logrotate Configuration:**

```
/home/deploy/smartschedule/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 7.2 Setup Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Setup system monitoring
sudo nano /etc/systemd/system/smartschedule-monitor.service
```

### 7.3 Database Backups

```bash
# Create backup script
nano /home/deploy/backup-db.sh
```

**Backup Script:**

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="smartschedule"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U smartschedule_user $DB_NAME > $BACKUP_DIR/smartschedule_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/smartschedule_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "smartschedule_*.sql.gz" -mtime +30 -delete

echo "Backup completed: smartschedule_$DATE.sql.gz"
```

```bash
# Make executable and setup cron
chmod +x /home/deploy/backup-db.sh
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/deploy/backup-db.sh
```

## Step 8: Security Hardening

### 8.1 Additional Security Measures

```bash
# Install additional security tools
sudo apt install ufw fail2ban rkhunter chkrootkit -y

# Configure fail2ban for application
sudo nano /etc/fail2ban/jail.local
```

**Fail2ban Configuration:**

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

### 8.2 Regular Security Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

## Step 9: Health Checks and Monitoring

### 9.1 Health Check Endpoints

The application includes health check endpoints:
- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database connectivity check

### 9.2 Monitoring Setup

```bash
# Install monitoring tools
sudo apt install prometheus-node-exporter -y

# Setup application monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Step 10: Rollback Procedure

### 10.1 Application Rollback

```bash
# Stop applications
pm2 stop all

# Rollback to previous version
cd /home/deploy/smartschedule
git checkout previous-tag
npm install
npm run build

# Restart applications
pm2 start ecosystem.config.js
```

### 10.2 Database Rollback

```bash
# Restore from backup
pg_restore -h localhost -U smartschedule_user -d smartschedule /path/to/backup.sql
```

### 10.3 Nginx Rollback

```bash
# Revert Nginx configuration
sudo cp /etc/nginx/sites-available/smartschedule.backup /etc/nginx/sites-available/smartschedule
sudo nginx -t
sudo systemctl reload nginx
```

## Verification Checklist

- [ ] SSL certificate installed and working
- [ ] HTTPS redirects working
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Database connections secure
- [ ] Logs being generated
- [ ] Backups scheduled
- [ ] Monitoring active
- [ ] Firewall configured
- [ ] Fail2ban active

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --force-renewal
   ```

2. **Application Not Starting**
   ```bash
   pm2 logs
   pm2 restart all
   ```

3. **Database Connection Issues**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "SELECT 1;"
   ```

4. **Nginx Configuration Issues**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Support

For deployment issues:
1. Check application logs: `pm2 logs`
2. Check system logs: `sudo journalctl -u nginx`
3. Verify SSL: `curl -I https://yourdomain.com`
4. Test database: `sudo -u postgres psql -c "SELECT 1;"`

## Security Notes

- Change all default passwords
- Use strong, unique passwords
- Enable 2FA where possible
- Regular security updates
- Monitor logs for suspicious activity
- Keep backups encrypted and offsite
