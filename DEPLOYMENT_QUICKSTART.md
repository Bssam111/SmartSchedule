# 🚀 Quick Start: GoDaddy Domain & Deployment

## 🛒 **Step 1: Buy Domain (5 minutes)**

### **Go to GoDaddy:**
1. Visit: https://www.godaddy.com
2. Search for: `smartschedule.com` (or your preferred name)
3. Add to cart and checkout
4. **Cost**: ~$15/year

### **Recommended Domain Names:**
- `smartschedule.com`
- `universityscheduler.com`
- `academicscheduler.com`
- `yourname-smartschedule.com`

## 🖥️ **Step 2: Buy VPS Hosting (5 minutes)**

### **GoDaddy VPS:**
1. Go to GoDaddy hosting section
2. Choose **"VPS Hosting"**
3. Select **"Economy VPS"** ($4.99/month)
4. Choose **Ubuntu 20.04 LTS**
5. Complete purchase

### **You'll Get:**
- **IP Address**: Your server's public IP
- **Username**: `root`
- **Password**: Sent via email

## 🔧 **Step 3: Deploy Your App (30 minutes)**

### **Connect to Your Server:**
```bash
ssh root@your-vps-ip-address
```

### **Install Everything:**
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

### **Set Up Database:**
```bash
sudo -u postgres psql
CREATE DATABASE smartschedule;
CREATE USER smartschedule_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE smartschedule TO smartschedule_user;
\q
```

### **Upload Your Code:**
```bash
# Create directory
mkdir -p /var/www/smartschedule
cd /var/www/smartschedule

# Upload your project files here
# (Use SCP, SFTP, or Git to upload)
```

### **Install & Build:**
```bash
# Backend
cd backend
npm install --production
npm run build

# Frontend
cd ../smart-schedule
npm install --production
npm run build
```

## 🌐 **Step 4: Configure Domain (10 minutes)**

### **Point Domain to VPS:**
1. Go to GoDaddy domain management
2. Update **A Record**:
   - **Type**: A
   - **Name**: @
   - **Value**: your-vps-ip-address
   - **TTL**: 600

### **Install SSL Certificate:**
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com
```

### **Configure Nginx:**
Create `/etc/nginx/sites-available/smartschedule`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Enable Site:**
```bash
ln -s /etc/nginx/sites-available/smartschedule /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## 🚀 **Step 5: Start Your App (5 minutes)**

### **Start Backend:**
```bash
cd /var/www/smartschedule/backend
pm2 start dist/server.js --name "smartschedule-backend"
pm2 save
pm2 startup
```

### **Start Frontend:**
```bash
cd /var/www/smartschedule/smart-schedule
pm2 start "npm run start" --name "smartschedule-frontend"
pm2 save
```

### **Check Status:**
```bash
pm2 status
pm2 logs
```

## 🧪 **Step 6: Test Your Site**

### **Test URLs:**
- **Main Site**: `https://yourdomain.com`
- **API Health**: `https://yourdomain.com/api/health`
- **Login**: `https://yourdomain.com/login`

### **Test Login:**
- Email: `student@demo.com`
- Password: `TestPassword123!`

## 💰 **Total Cost:**

### **Annual Costs:**
- **Domain**: $15/year
- **VPS**: $60/year
- **Total**: ~$75/year

### **Monthly Cost:**
- **VPS**: $5/month
- **Domain**: $1.25/month
- **Total**: ~$6.25/month

## 🎯 **Quick Commands:**

### **Check Status:**
```bash
pm2 status
pm2 logs
systemctl status nginx
```

### **Restart Services:**
```bash
pm2 restart all
systemctl restart nginx
```

### **Update Application:**
```bash
cd /var/www/smartschedule
git pull
npm install
npm run build
pm2 restart all
```

## 🆘 **Common Issues:**

### **Domain Not Working:**
- Wait 24-48 hours for DNS propagation
- Check DNS at: https://dnschecker.org

### **SSL Issues:**
- Check certificate: `certbot certificates`
- Renew: `certbot renew`

### **App Not Loading:**
- Check PM2: `pm2 status`
- Check Nginx: `systemctl status nginx`
- Check logs: `pm2 logs`

## 🎉 **Success!**

Your SmartSchedule application will be live at:
- **URL**: `https://yourdomain.com`
- **Secure**: SSL certificate installed
- **Professional**: Custom domain name
- **Scalable**: VPS hosting

**Total time: ~1 hour**
**Total cost: ~$75/year**

**Your university scheduling system is now live on the internet!** 🚀
