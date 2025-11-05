# 🌐 GoDaddy Domain Purchase & Deployment Guide

## 🛒 **Step 1: Purchase Domain from GoDaddy**

### **1.1 Go to GoDaddy**
- Visit: https://www.godaddy.com
- Click "Sign In" or "Create Account" if you don't have one

### **1.2 Search for Domain**
- In the search bar, enter your desired domain name
- **Recommended domains for your project:**
  - `smartschedule.com`
  - `smartschedule.app`
  - `universityscheduler.com`
  - `academicscheduler.com`
  - `yourname-smartschedule.com`

### **1.3 Choose Domain Extension**
- **`.com`** - Most popular and professional
- **`.app`** - Good for applications
- **`.edu`** - For educational institutions (requires verification)
- **`.org`** - For organizations

### **1.4 Select Domain**
- Click "Add to Cart" on your chosen domain
- **Pricing**: Usually $12-15/year for .com domains

### **1.5 Add Domain Protection (Recommended)**
- **Domain Privacy Protection**: $9.99/year (hides your personal info)
- **Auto-renewal**: Enable to avoid losing your domain

### **1.6 Complete Purchase**
- Review your order
- Enter payment information
- Complete the purchase

## 🖥️ **Step 2: Set Up GoDaddy VPS**

### **2.1 Purchase VPS Hosting**
- Go to GoDaddy's hosting section
- Choose **"VPS Hosting"** (not shared hosting)
- **Recommended plan**: "Economy VPS" or "Deluxe VPS"
- **Pricing**: $4.99-19.99/month

### **2.2 VPS Configuration**
- **Operating System**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: 1GB minimum (2GB recommended)
- **Storage**: 20GB minimum
- **Bandwidth**: Unlimited

### **2.3 Access Your VPS**
- GoDaddy will send you VPS credentials via email
- **IP Address**: Your server's public IP
- **Username**: Usually `root`
- **Password**: Provided in email

## 🔧 **Step 3: Prepare Your Application for Deployment**

### **3.1 Update Environment Variables**
Create `env.production` file:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smartschedule"

# JWT Secrets
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server
NODE_ENV="production"
PORT=3000

# CORS
CORS_ORIGIN="https://yourdomain.com"

# Security
ADMIN_IP_WHITELIST="your-ip-address"
```

### **3.2 Update Frontend Configuration**
Update `smart-schedule/lib/auth.ts`:
```typescript
// Change from localhost to your domain
const response = await fetch('https://yourdomain.com/api/auth/login', {
```

### **3.3 Create Production Build**
```bash
# Backend
cd backend
npm run build

# Frontend
cd smart-schedule
npm run build
```

## 🚀 **Step 4: Deploy to GoDaddy VPS**

### **4.1 Connect to Your VPS**
```bash
ssh root@your-vps-ip-address
```

### **4.2 Install Required Software**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y

# Install PM2
npm install -g pm2
```

### **4.3 Set Up Database**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE smartschedule;
CREATE USER smartschedule_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE smartschedule TO smartschedule_user;
\q
```

### **4.4 Upload Your Application**
```bash
# Create application directory
mkdir -p /var/www/smartschedule
cd /var/www/smartschedule

# Upload your files (use SCP, SFTP, or Git)
# Option 1: Using Git
git clone https://github.com/yourusername/smartschedule.git .

# Option 2: Using SCP from your local machine
# scp -r /path/to/your/project root@your-vps-ip:/var/www/smartschedule/
```

### **4.5 Install Dependencies**
```bash
# Backend
cd /var/www/smartschedule/backend
npm install --production

# Frontend
cd /var/www/smartschedule/smart-schedule
npm install --production
```

### **4.6 Configure Environment**
```bash
# Copy environment files
cp env.production backend/.env
cp env.production smart-schedule/.env.local
```

### **4.7 Build Applications**
```bash
# Build backend
cd /var/www/smartschedule/backend
npm run build

# Build frontend
cd /var/www/smartschedule/smart-schedule
npm run build
```

## 🌐 **Step 5: Configure Domain & SSL**

### **5.1 Point Domain to VPS**
- Go to your GoDaddy domain management
- Update **A Record** to point to your VPS IP address
- **Type**: A
- **Name**: @
- **Value**: your-vps-ip-address
- **TTL**: 600

### **5.2 Install SSL Certificate**
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **5.3 Configure Nginx**
Create `/etc/nginx/sites-available/smartschedule`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/smartschedule/smart-schedule/out;
        try_files $uri $uri.html $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **5.4 Enable Site**
```bash
# Enable site
ln -s /etc/nginx/sites-available/smartschedule /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## 🚀 **Step 6: Start Your Application**

### **6.1 Start Backend**
```bash
cd /var/www/smartschedule/backend
pm2 start dist/server.js --name "smartschedule-backend"
pm2 save
pm2 startup
```

### **6.2 Start Frontend**
```bash
cd /var/www/smartschedule/smart-schedule
pm2 start "npm run start" --name "smartschedule-frontend"
pm2 save
```

### **6.3 Check Status**
```bash
pm2 status
pm2 logs
```

## 🔒 **Step 7: Security Configuration**

### **7.1 Configure Firewall**
```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow ssh

# Allow HTTP/HTTPS
ufw allow 80
ufw allow 443

# Allow Node.js (if needed)
ufw allow 3001
```

### **7.2 Set Up Monitoring**
```bash
# Install monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🧪 **Step 8: Test Your Deployment**

### **8.1 Test Domain**
- Visit: `https://yourdomain.com`
- Check if the application loads
- Test login functionality

### **8.2 Test SSL**
- Verify SSL certificate is working
- Check for security warnings

### **8.3 Test API**
- Test: `https://yourdomain.com/api/health`
- Verify backend is responding

## 📋 **Step 9: Maintenance**

### **9.1 Regular Updates**
```bash
# Update system
apt update && apt upgrade -y

# Update Node.js packages
npm update

# Restart services
pm2 restart all
```

### **9.2 Backup Database**
```bash
# Create backup script
pg_dump smartschedule > /var/backups/smartschedule-$(date +%Y%m%d).sql
```

### **9.3 Monitor Logs**
```bash
# View logs
pm2 logs

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 💰 **Cost Breakdown**

### **Domain Costs:**
- **Domain**: $12-15/year
- **Privacy Protection**: $9.99/year
- **Total Domain**: ~$25/year

### **Hosting Costs:**
- **VPS**: $4.99-19.99/month
- **Total Hosting**: $60-240/year

### **Total Annual Cost:**
- **Minimum**: ~$85/year
- **Recommended**: ~$150/year

## 🎯 **Quick Start Commands**

### **Purchase Domain:**
1. Go to GoDaddy.com
2. Search for your domain
3. Add to cart and checkout

### **Set Up VPS:**
1. Purchase VPS hosting
2. Get credentials from email
3. SSH into your server
4. Follow deployment steps above

## 🆘 **Troubleshooting**

### **Domain Not Working:**
- Check DNS propagation: https://dnschecker.org
- Wait 24-48 hours for DNS to propagate
- Verify A record points to correct IP

### **SSL Issues:**
- Check certificate: `certbot certificates`
- Renew if needed: `certbot renew`

### **Application Not Loading:**
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs`
- Check Nginx: `systemctl status nginx`

## 🎉 **Success!**

Once completed, your SmartSchedule application will be live at:
- **URL**: `https://yourdomain.com`
- **Admin**: Access via your VPS
- **Monitoring**: PM2 dashboard

**Your university scheduling system is now live on the internet!** 🚀
