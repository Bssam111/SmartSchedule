# Railway Backend Configuration

## Setting Up Frontend to Connect to Railway Backend

When deploying to Railway, you need to configure the frontend to connect to your Railway backend URL instead of localhost.

## Environment Variables

### For Railway Deployment

In your Railway frontend service, set the following environment variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.railway.app
```

Or if using the legacy variable:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app/api
```

### Finding Your Railway Backend URL

1. Go to your Railway dashboard
2. Select your backend service
3. Go to the **Settings** tab
4. Find your **Public Domain** or **Custom Domain**
5. Copy the URL (e.g., `https://smart-schedule-backend-production.up.railway.app`)

### Example Configuration

If your Railway backend URL is `https://smart-schedule-backend-production.up.railway.app`, set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://smart-schedule-backend-production.up.railway.app
```

The frontend will automatically append `/api` to this URL.

## Local Development

For local development, you can either:

1. **Use local backend:**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

2. **Use Railway backend (for testing):**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.railway.app
   ```

## Verification

After setting the environment variable:

1. Rebuild your frontend service in Railway
2. Check the browser console - it should show the correct API URL
3. Test a login or API call to verify connectivity

## Troubleshooting

### Frontend still connecting to localhost

- **Check environment variables:** Make sure `NEXT_PUBLIC_API_BASE_URL` is set in Railway
- **Rebuild:** Environment variables require a rebuild to take effect
- **Check build logs:** Verify the variable is being read during build

### CORS errors

- Make sure your Railway backend has CORS configured to allow your frontend domain
- Check `FRONTEND_URL` in backend environment variables
- Verify `ALLOWED_ORIGINS` includes your frontend domain

### Connection refused

- Verify backend service is running in Railway
- Check backend health endpoint: `https://your-backend.railway.app/api/health`
- Verify backend is listening on the correct port (Railway sets PORT automatically)

