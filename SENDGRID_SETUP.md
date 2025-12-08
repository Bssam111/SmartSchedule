# SendGrid Email Setup Guide

## Why SendGrid?

Since SMTP connections are timing out (likely Railway blocking outbound SMTP), SendGrid is a better solution for cloud deployments:

- ✅ **API-based** - No SMTP port issues
- ✅ **Works with Railway** - No network restrictions
- ✅ **Free tier** - 100 emails/day forever
- ✅ **Better deliverability** - Professional email service
- ✅ **Better error reporting** - Detailed API responses

## Quick Setup

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up for free account
3. Verify your email address

### Step 2: Create API Key

1. Go to SendGrid Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Name it: `SmartSchedule Production`
4. Select "Full Access" (or "Mail Send" permissions)
5. Copy the API key (you'll only see it once!)

### Step 3: Set Railway Environment Variables

In Railway → Backend Service → Variables, add:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM=noreply@smartschedule24.com
```

**Important**: 
- Replace `SG.xxx...` with your actual API key
- `SENDGRID_FROM` must be a verified sender in SendGrid
- Or use `SMTP_FROM` if already set

### Step 4: Verify Sender Email (Required)

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter: `noreply@smartschedule24.com`
4. Fill in the form
5. Check your email and verify

**Note**: For production, you should set up Domain Authentication instead of Single Sender Verification.

### Step 5: Redeploy Backend

Railway will automatically redeploy when you save variables.

## How It Works

The email service now:
1. **Checks for `SENDGRID_API_KEY` first** - If set, uses SendGrid
2. **Falls back to SMTP** - If SendGrid not configured, uses SMTP
3. **Automatic detection** - No code changes needed

## Verification

After redeploying, check backend logs:

```
✅ Email service initialized with SendGrid
📧 SendGrid From: noreply@smartschedule24.com
```

When sending emails, you should see:
```
📧 Attempting to send email via SendGrid to: user@example.com
✅ Email sent successfully via SendGrid to: user@example.com
📧 SendGrid status: 202
```

## SendGrid vs SMTP

### SendGrid (Recommended)
- ✅ Works with Railway
- ✅ No port/firewall issues
- ✅ Better error messages
- ✅ Free tier: 100 emails/day
- ✅ Professional service

### SMTP (Current - Not Working)
- ❌ Connection timeouts
- ❌ Railway may block ports
- ❌ GoDaddy may block Railway IPs
- ⚠️  Works locally but not in cloud

## Free Tier Limits

SendGrid Free Tier:
- **100 emails/day** - Perfect for development/testing
- **Unlimited** - No monthly limit, just daily
- **Upgrade** - $19.95/month for 50,000 emails

## Domain Authentication (Optional - Recommended for Production)

For better deliverability:

1. Go to SendGrid → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Add DNS records to your domain
4. Wait for verification (usually < 24 hours)
5. Use your domain email: `noreply@smartschedule24.com`

## Troubleshooting

### Issue: "Sender email not verified"

**Solution**: Verify the sender email in SendGrid dashboard

### Issue: "API key invalid"

**Solution**: 
1. Check API key is correct
2. Ensure API key has "Mail Send" permissions
3. Regenerate API key if needed

### Issue: Emails going to spam

**Solution**:
1. Set up Domain Authentication
2. Use a proper "From" address
3. Include unsubscribe links (SendGrid adds this automatically)

## Environment Variables Summary

**For SendGrid (Recommended):**
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM=noreply@smartschedule24.com
```

**For SMTP (Fallback - if SendGrid not set):**
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@smartschedule24.com
SMTP_PASS=your-password
SMTP_FROM=noreply@smartschedule24.com
```

## Code Changes

The email service now:
- ✅ Automatically detects SendGrid API key
- ✅ Uses SendGrid if available
- ✅ Falls back to SMTP if SendGrid not configured
- ✅ Better error messages for both services

No code changes needed - just set the environment variable!

