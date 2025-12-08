# SMTP Connection Timeout Fix

## Problem

Email sending fails with connection timeout:
```
Error: Connection timeout
code: 'ETIMEDOUT'
command: 'CONN'
```

## Root Causes

1. **Railway blocking outbound SMTP** - Some cloud providers block SMTP ports
2. **SMTP server blocking Railway IPs** - GoDaddy/SecureServer might block cloud provider IPs
3. **Incorrect port/secure configuration** - Port 587 vs 465 confusion
4. **Firewall/Network issues** - Railway network restrictions

## Current Configuration (from image)

- `SMTP_HOST`: `smtpout.secureserver.net` ✅
- `SMTP_PORT`: `587` ✅ (correct for STARTTLS)
- `SMTP_SECURE`: `false` ✅ (correct for port 587)
- `SMTP_USER`: `noreply@smartschedule24.com` ✅
- `SMTP_PASS`: `bssam2004` ✅

## Solutions

### Solution 1: Try Port 465 with SSL (Recommended)

GoDaddy/SecureServer supports both ports. Try port 465 with SSL:

1. **Update Railway Variables:**
   ```
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

2. **Redeploy backend service**

Port 465 uses SSL/TLS directly, which might work better with Railway's network.

### Solution 2: Check Railway Network Restrictions

Railway might be blocking outbound SMTP connections. Check:

1. Railway Dashboard → Backend Service → Settings
2. Look for network/firewall restrictions
3. Contact Railway support if SMTP is blocked

### Solution 3: Use Alternative SMTP Service

If Railway blocks SMTP, consider:

1. **SendGrid** (recommended for cloud)
   - Free tier: 100 emails/day
   - Works well with Railway
   - API-based (not SMTP)

2. **Mailgun**
   - Free tier: 5,000 emails/month
   - SMTP and API support

3. **AWS SES**
   - Very cheap
   - Requires AWS account

### Solution 4: Use Railway's Email Service

Railway might have an email service or integration. Check Railway documentation.

### Solution 5: Whitelist Railway IPs (if possible)

If you have access to GoDaddy email settings:
1. Find Railway's outbound IP addresses
2. Whitelist them in GoDaddy email security settings
3. This is usually not possible with shared hosting

## Testing SMTP Connection

### Test 1: Verify Configuration

After updating variables, check backend logs on startup:
```
📧 SMTP Configuration: {
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  requireTLS: false,
  ...
}
```

### Test 2: Test Email Sending

Try sending a test email and check logs for:
- Connection attempts
- Timeout errors
- Authentication errors
- Success messages

## GoDaddy/SecureServer Specific Notes

### Port 587 (STARTTLS)
- Uses STARTTLS (upgrades connection to TLS)
- `secure: false` ✅ (correct)
- `requireTLS: true` ✅ (added in code)

### Port 465 (SSL/TLS)
- Uses SSL/TLS directly
- `secure: true` ✅ (required)
- `requireTLS: false` ✅

### Common Issues

1. **IP Blocking**: GoDaddy may block cloud provider IPs
2. **Rate Limiting**: GoDaddy has strict rate limits
3. **Authentication**: Some accounts require app-specific passwords

## Recommended Configuration

For Railway deployment, try this order:

1. **First try Port 465:**
   ```
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

2. **If that fails, try Port 587:**
   ```
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

3. **If both fail, use SendGrid API:**
   - More reliable for cloud deployments
   - Better deliverability
   - Free tier available

## Code Changes Made

I've updated the email service to:
- Add connection timeouts (10 seconds)
- Add `requireTLS` for port 587
- Add better logging for debugging
- Add debug mode in development

## Next Steps

1. **Try Port 465 first:**
   - Set `SMTP_PORT=465`
   - Set `SMTP_SECURE=true`
   - Redeploy backend

2. **Check backend logs** for connection attempts

3. **If still timing out**, consider:
   - Using SendGrid or Mailgun
   - Contacting Railway support about SMTP restrictions
   - Using a different email provider

## Alternative: SendGrid Integration

If SMTP continues to fail, I can help you integrate SendGrid's API instead of SMTP. This is more reliable for cloud deployments.

SendGrid benefits:
- ✅ Works reliably with Railway
- ✅ Better deliverability
- ✅ Free tier: 100 emails/day
- ✅ API-based (no SMTP port issues)
- ✅ Better error reporting

Would you like me to implement SendGrid integration?

