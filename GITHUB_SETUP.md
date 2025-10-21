# 🚀 GitHub Setup for Vercel Deployment

## 📋 **Step 1: Create GitHub Repository**

### **1.1 Go to GitHub**
1. Visit: https://github.com
2. Sign in to your account (or create one)
3. Click the **"+"** button in the top right
4. Select **"New repository"**

### **1.2 Repository Settings**
- **Repository name**: `SmartSchedule` (or `smartschedule`)
- **Description**: `University Scheduling System with RBAC`
- **Visibility**: Public (required for free Vercel)
- **Initialize**: ✅ Add README file
- **Add .gitignore**: ✅ Node
- **Choose a license**: MIT License

### **1.3 Create Repository**
Click **"Create repository"**

## 🔧 **Step 2: Prepare Your Local Project**

### **2.1 Initialize Git (if not already done)**
```bash
cd C:\Users\bssam\SmartSchedule
git init
```

### **2.2 Create .gitignore File**
Create `.gitignore` in your project root:
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
.next/
out/
dist/
build/

# Database
*.db
*.sqlite

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
tmp/
temp/
```

### **2.3 Update Package.json (if needed)**
Make sure your `package.json` files have proper scripts:
```json
{
  "name": "smartschedule",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 📤 **Step 3: Push to GitHub**

### **3.1 Add Remote Origin**
```bash
cd C:\Users\bssam\SmartSchedule
git remote add origin https://github.com/YOUR_USERNAME/SmartSchedule.git
```

### **3.2 Add All Files**
```bash
git add .
```

### **3.3 Commit Changes**
```bash
git commit -m "Initial commit: SmartSchedule University Scheduling System"
```

### **3.4 Push to GitHub**
```bash
git push -u origin main
```

## 🚀 **Step 4: Deploy to Vercel**

### **4.1 Go to Vercel**
1. Visit: https://vercel.com
2. Click **"Sign up with GitHub"**
3. Authorize Vercel to access your repositories

### **4.2 Import Project**
1. Click **"New Project"**
2. Select your **SmartSchedule** repository
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: `smart-schedule`
5. **Build Command**: `npm run build`
6. **Output Directory**: `out` (for static export)
7. Click **"Deploy"**

### **4.3 Configure Environment Variables**
In Vercel dashboard:
1. Go to your project settings
2. Go to **"Environment Variables"**
3. Add:
   - `NEXT_PUBLIC_API_URL` = `https://smartschedule24.com/api`
   - `NODE_ENV` = `production`

## 🌐 **Step 5: Connect Your Domain**

### **5.1 Add Custom Domain**
1. Go to your project in Vercel
2. Go to **"Domains"** tab
3. Click **"Add Domain"**
4. Enter: `smartschedule24.com`
5. Click **"Add"**

### **5.2 Configure DNS in GoDaddy**
1. Go to GoDaddy domain management
2. Go to **"DNS"** section
3. Update DNS records:

#### **For smartschedule24.com:**
- **Type**: A
- **Name**: @
- **Value**: 76.76.19.61
- **TTL**: 600

#### **For www.smartschedule24.com:**
- **Type**: CNAME
- **Name**: www
- **Value**: cname.vercel-dns.com
- **TTL**: 600

## 🎯 **Step 6: Update for Production**

### **6.1 Update API URLs**
Update `smart-schedule/lib/auth.ts`:
```typescript
// Change from localhost to your domain
const response = await fetch('https://smartschedule24.com/api/auth/login', {
```

### **6.2 Update Next.js Config**
Update `smart-schedule/next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### **6.3 Push Changes**
```bash
git add .
git commit -m "Update for production deployment"
git push
```

## 🧪 **Step 7: Test Your Deployment**

### **7.1 Check Vercel Deployment**
- Go to your Vercel dashboard
- Check deployment status
- View deployment logs if needed

### **7.2 Test Your Domain**
- Visit: `https://smartschedule24.com`
- Check if the site loads
- Test navigation

### **7.3 Test Login**
- Go to: `https://smartschedule24.com/login`
- Use credentials:
  - Email: `student@demo.com`
  - Password: `TestPassword123!`

## 🎉 **Success!**

Your SmartSchedule application will be live at:
- **URL**: `https://smartschedule24.com`
- **Secure**: SSL certificate included
- **Fast**: Global CDN
- **Professional**: Custom domain

## 💰 **Cost Breakdown**

### **GitHub:**
- **Repository**: FREE
- **Public repos**: Unlimited

### **Vercel:**
- **Frontend hosting**: FREE
- **Custom domain**: FREE
- **SSL certificate**: FREE
- **Total**: $0/month

### **Total Cost:**
- **Domain**: Already purchased ✅
- **Hosting**: FREE
- **Total**: $0/month

## 🆘 **Troubleshooting**

### **Git Issues:**
- Check if Git is installed: `git --version`
- Verify GitHub credentials
- Check repository permissions

### **Vercel Issues:**
- Check build logs in Vercel dashboard
- Verify environment variables
- Check Next.js configuration

### **Domain Issues:**
- Wait 24-48 hours for DNS propagation
- Check DNS settings in GoDaddy
- Verify domain in Vercel

## 🎯 **Next Steps**

1. **Create GitHub repository**
2. **Push your code to GitHub**
3. **Deploy to Vercel**
4. **Connect your domain**
5. **Test your application**
6. **Share your live site!**

**Your SmartSchedule application will be live at `https://smartschedule24.com` in about 30 minutes!** 🚀
