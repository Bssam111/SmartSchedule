# Prisma Setup in Docker - Academic Plan System

## Issue
The Prisma client is out of sync with the schema. The schema has been updated with new models (Major, AcademicPlan, etc.), but the Prisma client needs to be regenerated.

## Solution

### Step 1: Run Database Migration
First, create and apply the database migration:

```bash
# If running locally (outside Docker)
cd backend
npx prisma migrate dev --name add_academic_plan_system

# If running in Docker container
docker-compose exec backend npx prisma migrate dev --name add_academic_plan_system
```

### Step 2: Generate Prisma Client
Regenerate the Prisma client to include the new models:

```bash
# If running locally
cd backend
npx prisma generate

# If running in Docker container
docker-compose exec backend npx prisma generate
```

### Step 3: Restart Backend Service
After generating the client, restart the backend:

```bash
# If using Docker Compose
docker-compose restart backend

# Or rebuild if needed
docker-compose up -d --build backend
```

### Step 4: Run Seed Script
Now you can run the seed script:

```bash
# If running locally
cd backend
npx tsx src/scripts/seed-swe-plan.ts

# If running in Docker container
docker-compose exec backend npx tsx src/scripts/seed-swe-plan.ts
```

## Alternative: One-Command Setup

If you want to do everything at once:

```bash
# In Docker container
docker-compose exec backend sh -c "npx prisma migrate dev --name add_academic_plan_system && npx prisma generate && npx tsx src/scripts/seed-swe-plan.ts"
```

## Verify Setup

After running the seed script, verify the data:

```bash
# Check if Major was created
docker-compose exec backend npx prisma studio
# Or use psql to query the database
```

## Troubleshooting

### Error: "Unknown argument `code`"
- **Cause**: Prisma client not regenerated
- **Fix**: Run `npx prisma generate` (see Step 2)

### Error: "Table does not exist"
- **Cause**: Migration not applied
- **Fix**: Run `npx prisma migrate dev` (see Step 1)

### Error: "Cannot find module '@prisma/client'"
- **Cause**: Dependencies not installed
- **Fix**: Run `npm install` in the backend directory

### Docker-specific Issues

If you're having issues with Docker:

1. **Ensure backend container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs backend
   ```

3. **Access backend container shell:**
   ```bash
   docker-compose exec backend sh
   ```

4. **Run commands inside container:**
   ```bash
   cd /app  # or wherever your backend code is
   npx prisma migrate dev
   npx prisma generate
   ```

## Schema Location

The Prisma schema is located at:
- `smart-schedule/prisma/schema.prisma` (if using monorepo structure)
- `backend/prisma/schema.prisma` (if using separate backend)

Make sure you're running Prisma commands in the directory that contains the `prisma` folder.

