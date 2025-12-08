# Quick Setup - Academic Plan System

## For Docker Users

Run these commands in order:

```bash
# 1. Navigate to backend directory (if not already there)
cd backend

# 2. Run migration to create new tables
docker-compose exec backend npx prisma migrate dev --name add_academic_plan_system

# 3. Generate Prisma client with new models
docker-compose exec backend npx prisma generate

# 4. Restart backend to load new Prisma client
docker-compose restart backend

# 5. Seed the SWE study plan
docker-compose exec backend npx tsx src/scripts/seed-swe-plan.ts
```

## Alternative: One-Line Setup

```bash
docker-compose exec backend sh -c "npx prisma migrate dev --name add_academic_plan_system && npx prisma generate && npx tsx src/scripts/seed-swe-plan.ts"
```

Then restart:
```bash
docker-compose restart backend
```

## Verify

After setup, verify the data was created:

```bash
# Check if Major was created
docker-compose exec backend npx prisma studio
# Or check logs
docker-compose logs backend | grep "SWE"
```

## Troubleshooting

If you get "Unknown argument `code`" error:
- The Prisma client wasn't regenerated
- Run: `docker-compose exec backend npx prisma generate`
- Then restart: `docker-compose restart backend`

If you get "Table does not exist" error:
- The migration wasn't applied
- Run: `docker-compose exec backend npx prisma migrate dev`

