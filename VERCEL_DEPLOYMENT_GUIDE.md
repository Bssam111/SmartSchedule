# 🚀 Vercel Deployment Guide for SmartSchedule

## 🎉 **Your Domain: smartschedule24.com**

## 🌟 **Why Vercel?**
- ✅ **Made by Next.js creators**
- ✅ **Perfect for React/Next.js apps**
- ✅ **FREE tier available**
- ✅ **Automatic deployments**
- ✅ **Custom domain support**
- ✅ **SSL certificate included**
- ✅ **Global CDN**

## 🚀 **Step 1: Prepare Your Code**

### **1.1 Update API URL**
Update `smart-schedule/lib/auth.ts`:
```typescript
// Change from localhost to your domain
const response = await fetch('https://smartschedule24.com/api/auth/login', {
```

### **1.2 Create Environment File**
Create `smart-schedule/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://smartschedule24.com/api
NODE_ENV=production
```

### **1.3 Update Next.js Config**
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

## 🚀 **Step 2: Deploy to Vercel**

### **2.1 Go to Vercel**
1. Visit: https://vercel.com
2. Click "Sign up with GitHub"
3. Authorize Vercel to access your repositories

### **2.2 Import Your Project**
1. Click "New Project"
2. Select your SmartSchedule repository
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: `smart-schedule`
5. **Build Command**: `npm run build`
6. **Output Directory**: `out`
7. Click "Deploy"

### **2.3 Configure Environment Variables**
In Vercel dashboard:
1. Go to your project settings
2. Go to "Environment Variables"
3. Add:
   - `NEXT_PUBLIC_API_URL` = `https://smartschedule24.com/api`
   - `NODE_ENV` = `production`

## 🌐 **Step 3: Connect Your Domain**

### **3.1 Add Custom Domain in Vercel**
1. Go to your project in Vercel
2. Go to "Domains" tab
3. Click "Add Domain"
4. Enter: `smartschedule24.com`
5. Click "Add"
6. Also add: `www.smartschedule24.com`

### **3.2 Configure DNS in GoDaddy**
1. Go to GoDaddy domain management
2. Go to "DNS" section
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

### **3.3 Wait for DNS Propagation**
- **Time**: 24-48 hours
- **Check**: https://dnschecker.org
- **Test**: `https://smartschedule24.com`

## 🎯 **Step 4: Deploy Backend (Separate)**

### **Option A: Railway (Recommended)**
1. Go to: https://railway.app
2. Sign up with GitHub
3. Create new project
4. Connect your repository
5. Set root directory to `backend`
6. Add environment variables:
   - `DATABASE_URL` = `postgresql://...`
   - `JWT_ACCESS_SECRET` = `your-secret`
   - `JWT_REFRESH_SECRET` = `your-secret`
   - `NODE_ENV` = `production`

### **Option B: Render**
1. Go to: https://render.com
2. Sign up with GitHub
3. Create new Web Service
4. Connect your repository
5. Set root directory to `backend`
6. Add environment variables

### **Option C: Heroku**
1. Go to: https://heroku.com
2. Sign up
3. Create new app
4. Connect GitHub repository
5. Set root directory to `backend`
6. Add environment variables

## 🔧 **Step 5: Update Frontend for Backend**

### **5.1 Get Backend URL**
After deploying backend, you'll get a URL like:
- Railway: `https://your-backend.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app.herokuapp.com`

### **5.2 Update Frontend**
Update `smart-schedule/lib/auth.ts`:
```typescript
const response = await fetch('https://your-backend-url.com/api/auth/login', {
```

### **5.3 Redeploy Frontend**
1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Test your application

## 🧪 **Step 6: Test Your Deployment**

### **6.1 Test Frontend**
- Visit: `https://smartschedule24.com`
- Check if the site loads
- Test navigation

### **6.2 Test Backend**
- Visit: `https://your-backend-url.com/api/health`
- Should return: `{"status":"healthy"}`

### **6.3 Test Login**
- Go to: `https://smartschedule24.com/login`
- Use credentials:
  - Email: `student@demo.com`
  - Password: `TestPassword123!`
- Should redirect to dashboard

## 🎉 **Success!**

Your SmartSchedule application is now live at:
- **URL**: `https://smartschedule24.com`
- **Secure**: SSL certificate included
- **Fast**: Global CDN
- **Professional**: Custom domain

## 💰 **Cost Breakdown**

### **Vercel (Frontend):**
- **Free tier**: 100GB bandwidth/month
- **Custom domain**: FREE
- **SSL certificate**: FREE
- **Total**: $0/month

### **Backend Hosting:**
- **Railway**: $5/month
- **Render**: $7/month
- **Heroku**: $7/month

### **Total Cost:**
- **Minimum**: $5/month
- **Recommended**: $5/month (Railway)

## 🆘 **Troubleshooting**

### **Domain Not Working:**
- Check DNS propagation: https://dnschecker.org
- Wait 24-48 hours
- Verify DNS settings in GoDaddy

### **Build Errors:**
- Check Vercel build logs
- Verify environment variables
- Check Next.js configuration

### **Backend Issues:**
- Check backend logs
- Verify environment variables
- Test backend URL directly

### **SSL Issues:**
- Vercel handles SSL automatically
- Wait for certificate generation
- Check domain configuration

## 🎯 **Next Steps**

1. **Deploy frontend to Vercel**
2. **Deploy backend to Railway/Render**
3. **Connect your domain**
4. **Test your application**
5. **Share your live site!**

**Your SmartSchedule application will be live at `https://smartschedule24.com` in about 30 minutes!** 🚀
