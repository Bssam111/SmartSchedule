# Using Railway Database with Docker

This guide explains how to configure the Docker backend to use your Railway database instead of the local Docker database.

## Quick Setup

### Option 1: Set Environment Variable (Recommended)

Create a `.env` file in the project root (same directory as `docker-compose.dev.yml`) with your Railway database URL:

```bash
RAILWAY_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@yamanote.proxy.rlwy.net:16811/railway?schema=public&sslmode=require&pgbouncer=true&connect_timeout=15
```

Replace `YOUR_PASSWORD` with your actual Railway database password.

### Option 2: Export in Terminal (Temporary)

For Windows PowerShell:
```powershell
$env:RAILWAY_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@yamanote.proxy.rlwy.net:16811/railway?schema=public&sslmode=require&pgbouncer=true&connect_timeout=15"
docker-compose -f docker-compose.dev.yml up -d
```

For Linux/Mac:
```bash
export RAILWAY_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@yamanote.proxy.rlwy.net:16811/railway?schema=public&sslmode=require&pgbouncer=true&connect_timeout=15"
docker-compose -f docker-compose.dev.yml up -d
```

## Getting Your Railway Database URL

1. Go to your Railway project dashboard
2. Click on your PostgreSQL service
3. Go to the "Variables" tab
4. Find `DATABASE_URL` or `POSTGRES_URL`
5. Copy the connection string

The URL format should look like:
```
postgresql://postgres:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

## After Setting Up

1. **Restart the backend container:**
   ```bash
   docker-compose -f docker-compose.dev.yml restart backend-dev
   ```

2. **Verify the connection:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend-dev npx tsx -r tsconfig-paths/register src/scripts/check-database-and-requests.ts
   ```

3. **Run migrations (if needed):**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma db push
   ```

4. **Seed initial data:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend-dev npx tsx -r tsconfig-paths/register src/scripts/seed-committee-and-majors.ts
   ```

## Important Notes

- The local Docker database service will still start, but the backend won't use it when `RAILWAY_DATABASE_URL` is set
- Make sure your Railway database has the correct schema (run `prisma db push` if needed)
- The Railway database should have SSL enabled (`sslmode=require`)
- All access requests will now be stored in your Railway database

## Troubleshooting

If you see connection errors:
1. Verify your Railway database URL is correct
2. Check that your Railway database is running and accessible
3. Ensure your IP is whitelisted in Railway (if required)
4. Check the backend logs: `docker-compose -f docker-compose.dev.yml logs backend-dev`
