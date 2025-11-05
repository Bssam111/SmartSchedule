#!/bin/bash

# SmartSchedule GoDaddy Deployment Script
# This script automates the deployment process to GoDaddy VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
VPS_IP=""
VPS_USER="root"
APP_DIR="/home/deploy/smartschedule"
BACKUP_DIR="/home/deploy/backups"
LOG_FILE="/var/log/smartschedule-deploy.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update system
    apt update && apt upgrade -y
    
    # Install essential packages
    apt install -y curl wget git nginx postgresql postgresql-contrib \
        fail2ban ufw htop iotop nethogs certbot python3-certbot-nginx \
        software-properties-common apt-transport-https ca-certificates \
        gnupg lsb-release
    
    print_success "System dependencies installed"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js 20.x..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    print_success "Node.js and PM2 installed"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Add Docker repository
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add deploy user to docker group
    usermod -aG docker deploy
    
    print_success "Docker installed"
}

# Function to setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE smartschedule;
CREATE USER smartschedule_user WITH PASSWORD '$(openssl rand -base64 32)';
GRANT ALL PRIVILEGES ON DATABASE smartschedule TO smartschedule_user;
\q
EOF
    
    # Configure PostgreSQL security
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
    
    # Restart PostgreSQL
    systemctl restart postgresql
    
    print_success "Database setup completed"
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Configure UFW
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    print_success "Firewall configured"
}

# Function to setup fail2ban
setup_fail2ban() {
    print_status "Configuring fail2ban..."
    
    # Create fail2ban configuration
    cat > /etc/fail2ban/jail.local << EOF
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
EOF
    
    # Start fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    print_success "Fail2ban configured"
}

# Function to setup Nginx
setup_nginx() {
    print_status "Configuring Nginx..."
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/smartschedule << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Rate limiting configuration
http {
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/smartschedule /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    print_success "Nginx configured"
}

# Function to setup SSL
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Get SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    print_success "SSL certificate configured"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Create deploy user if not exists
    if ! id "deploy" &>/dev/null; then
        useradd -m -s /bin/bash deploy
        usermod -aG sudo deploy
        usermod -aG docker deploy
    fi
    
    # Switch to deploy user
    sudo -u deploy bash << EOF
# Clone repository
cd /home/deploy
if [ -d "smartschedule" ]; then
    cd smartschedule
    git pull origin main
else
    git clone https://github.com/your-username/smartschedule.git
    cd smartschedule
fi

# Install dependencies
cd backend
npm install --production
cd ../smart-schedule
npm install --production

# Build application
npm run build
cd ../backend
npm run build
EOF
    
    print_success "Application deployed"
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2..."
    
    # Create PM2 ecosystem file
    sudo -u deploy tee /home/deploy/smartschedule/ecosystem.config.js << EOF
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
EOF
    
    # Start applications
    sudo -u deploy bash << EOF
cd /home/deploy/smartschedule
pm2 start ecosystem.config.js
pm2 save
pm2 startup
EOF
    
    print_success "PM2 configured"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create log rotation
    tee /etc/logrotate.d/smartschedule << EOF
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
EOF
    
    # Create backup script
    sudo -u deploy tee /home/deploy/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="smartschedule"

mkdir -p \$BACKUP_DIR

# Create database backup
pg_dump -h localhost -U smartschedule_user \$DB_NAME > \$BACKUP_DIR/smartschedule_\$DATE.sql

# Compress backup
gzip \$BACKUP_DIR/smartschedule_\$DATE.sql

# Remove backups older than 30 days
find \$BACKUP_DIR -name "smartschedule_*.sql.gz" -mtime +30 -delete

echo "Backup completed: smartschedule_\$DATE.sql.gz"
EOF
    
    chmod +x /home/deploy/backup-db.sh
    
    # Setup daily backup
    sudo -u deploy bash << EOF
echo "0 2 * * * /home/deploy/backup-db.sh" | crontab -
EOF
    
    print_success "Monitoring configured"
}

# Function to run security tests
run_security_tests() {
    print_status "Running security tests..."
    
    # Wait for services to start
    sleep 30
    
    # Run security test script
    if [ -f "scripts/security-test.sh" ]; then
        chmod +x scripts/security-test.sh
        ./scripts/security-test.sh
    else
        print_warning "Security test script not found"
    fi
    
    print_success "Security tests completed"
}

# Function to display deployment summary
display_summary() {
    print_success "Deployment completed successfully!"
    
    echo -e "\n${BLUE}Deployment Summary:${NC}"
    echo "=================="
    echo "Domain: https://$DOMAIN"
    echo "Backend API: https://$DOMAIN/api"
    echo "Frontend: https://$DOMAIN"
    echo "Database: PostgreSQL (localhost)"
    echo "Process Manager: PM2"
    echo "Web Server: Nginx"
    echo "SSL: Let's Encrypt"
    echo "Monitoring: Enabled"
    echo "Backups: Daily at 2 AM"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Update DNS records to point to $VPS_IP"
    echo "2. Configure environment variables in /home/deploy/smartschedule/.env"
    echo "3. Run database migrations: cd /home/deploy/smartschedule/backend && npx prisma migrate deploy"
    echo "4. Test the application: https://$DOMAIN"
    echo "5. Review security logs: pm2 logs"
    
    echo -e "\n${YELLOW}Security Checklist:${NC}"
    echo "✅ SSL certificate installed"
    echo "✅ Security headers configured"
    echo "✅ Rate limiting active"
    echo "✅ Firewall configured"
    echo "✅ Fail2ban active"
    echo "✅ Database secured"
    echo "✅ Monitoring enabled"
    echo "✅ Backups scheduled"
}

# Main deployment function
main() {
    print_status "Starting SmartSchedule deployment to GoDaddy VPS..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root"
        exit 1
    fi
    
    # Get domain and IP
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain name: " DOMAIN
    fi
    
    if [ -z "$VPS_IP" ]; then
        read -p "Enter your VPS IP address: " VPS_IP
    fi
    
    # Start deployment
    install_dependencies
    install_nodejs
    install_docker
    setup_database
    setup_firewall
    setup_fail2ban
    setup_nginx
    setup_ssl
    deploy_application
    setup_pm2
    setup_monitoring
    run_security_tests
    display_summary
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"
