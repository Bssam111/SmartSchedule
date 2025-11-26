# Database Migrations Fix

## 🎯 Problem

The Postgres database in Railway had no tables, even though the Prisma schema defines many tables (users, courses, sections, rooms, etc.). This was because database migrations were not being run automatically when the backend service deployed.

## ✅ Solution

Updated `backend/Dockerfile.prod` to automatically run Prisma migrations when the container starts, before the application server begins.

### Changes Made

1. **Kept Prisma CLI installed** in the production image (previously it was removed after generating the client)
2. **Created an entrypoint script** that:
   - Runs `prisma migrate deploy` to apply pending migrations
   - Falls back to `prisma db push` if migrations fail (for initial setup)
   - Then starts the application server

### How It Works

When the backend container starts:
1. The entrypoint script runs first
2. It executes `npx prisma migrate deploy` to apply all pending migrations
3. If migrations succeed, it starts the application server
4. If migrations fail (e.g., first deployment), it falls back to `prisma db push`

## 📋 What Happens Next

After Railway redeploys the backend service:

1. **Migrations will run automatically** when the container starts
2. **All tables will be created** in the Postgres database:
   - users
   - courses
   - sections
   - rooms
   - time_slots
   - schedules
   - assignments
   - preferences
   - feedback
   - notifications
   - levels
   - authenticators
   - roles
   - security_logs
   - And all related junction tables

3. **You can verify** by:
   - Going to Railway → Postgres → Database → Data
   - You should now see all the tables listed

## 🚀 Deployment

The changes have been committed and pushed to the repository. Railway will automatically:
1. Detect the push
2. Rebuild the backend service
3. Run migrations on startup
4. Create all database tables

## ⏱️ Expected Timeline

- **Build time**: 2-5 minutes
- **Migration time**: 10-30 seconds (depending on database connection speed)
- **Total**: Usually completes within 5 minutes

## 🔍 Verification Steps

After deployment completes:

1. **Check Railway Logs**:
   - Go to Railway → handsome-radiance (backend) → Deploy Logs
   - Look for: `🔄 Running database migrations...`
   - Then: `✅ Migrations completed successfully`
   - Finally: `🚀 Starting application server...`

2. **Check Database**:
   - Go to Railway → Postgres → Database → Data
   - You should see all tables listed (users, courses, sections, etc.)

3. **Test API**:
   - Try accessing the health endpoint: `https://smartschedule24.com/api/health`
   - Should return success

## ⚠️ Important Notes

- **Migrations run automatically** on every container restart
- **Only pending migrations** are applied (won't re-run already applied migrations)
- **Safe to redeploy** - migrations are idempotent
- **First deployment** may use `db push` fallback if migration history doesn't exist

## 🐛 Troubleshooting

### Migrations Fail to Run

If you see errors in the logs:
1. **Check DATABASE_URL** is set correctly in Railway
2. **Verify database connection** - check Postgres service is running
3. **Check migration files** exist in `backend/prisma/migrations/`

### Tables Still Not Appearing

1. **Wait for deployment** to complete (check Deploy Logs)
2. **Check migration logs** for errors
3. **Manually run migrations** if needed (see below)

### Manual Migration (If Needed)

If automatic migrations don't work, you can run them manually:

1. Go to Railway → handsome-radiance → **Deployments**
2. Click on the latest deployment
3. Open **Railway CLI** or use **One-Click Shell**
4. Run:
   ```bash
   npx prisma migrate deploy
   ```

Or use Railway's database connection:
1. Go to Railway → Postgres → **Connect**
2. Use the connection string to connect with a database client
3. Run the SQL from `backend/prisma/migrations/20251120094431_init/migration.sql`

## ✅ Success Criteria

- ✅ All tables appear in Railway → Postgres → Database → Data
- ✅ Backend service starts successfully
- ✅ API endpoints respond correctly
- ✅ No migration errors in logs

