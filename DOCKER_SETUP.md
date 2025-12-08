# Docker Setup Guide - SmartSchedule

Complete guide to running SmartSchedule locally using Docker.

## Prerequisites

- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)
- At least **8GB RAM** allocated to Docker Desktop
- Ports **3000**, **3001**, and **5432** available on your machine

## Quick Start

### Step 1: Environment Configuration

Create a `.env` file in the project root (optional, defaults are provided):

```bash
# Copy the example template (if available) or create manually
cp .env.example .env
```

Or create `.env` manually with these variables:

```env
# Database Configuration
POSTGRES_USER=smartschedule
POSTGRES_PASSWORD=dev_password_change_in_production
POSTGRES_DB=smartschedule_dev

# Backend Configuration
JWT_SECRET=dev-secret-key-change-this-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BACKEND_PORT=3001

# Frontend Configuration
FRONTEND_PORT=3000

# Application URLs
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Note:** The Docker Compose files will use sensible defaults if `.env` is not present.

### Step 2: Start All Services

**Option A: Using Docker Compose (Recommended)**

```bash
# Build and start all services in detached mode
docker compose up -d --build

# Or use the development compose file explicitly
docker compose -f docker-compose.dev.yml up -d --build
```

**Option B: Using Startup Script**

**Windows (PowerShell):**
```powershell
.\start-docker.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

### Step 3: Verify Services

Check container status:
```bash
docker compose ps
```

View logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
```

### Step 4: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Backend Health Check:** http://localhost:3001/healthz
- **Database:** localhost:5432 (credentials from `.env`)

## Container Services

### 1. Database (PostgreSQL 16)

- **Container:** `smartschedule-db` or `smartschedule-db-dev`
- **Port:** 5432
- **Default Credentials:**
  - User: `smartschedule`
  - Password: `dev_password` (or from `.env`)
  - Database: `smartschedule_dev`
- **Data Persistence:** Docker volume `postgres_data`

### 2. Backend (Express + TypeScript)

- **Container:** `smartschedule-backend` or `smartschedule-backend-dev`
- **Port:** 3001
- **Hot Reload:** Enabled (source code mounted as volume)
- **Health Check:** `/healthz` endpoint

### 3. Frontend (Next.js 15)

- **Container:** `smartschedule-frontend` or `smartschedule-frontend-dev`
- **Port:** 3000
- **Hot Reload:** Enabled (source code mounted as volume)
- **API Connection:** Points to backend at `http://localhost:3001`

## Common Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### Stop and Remove Volumes (⚠️ Deletes database data)
```bash
docker compose down -v
```

### Rebuild Containers
```bash
docker compose up -d --build
```

### View Real-time Logs
```bash
docker compose logs -f
```

### Execute Commands in Containers

**Backend:**
```bash
# Run migrations
docker compose exec backend npx prisma migrate dev

# Generate Prisma client
docker compose exec backend npx prisma generate

# Access shell
docker compose exec backend sh
```

**Database:**
```bash
# Access PostgreSQL CLI
docker compose exec database psql -U smartschedule -d smartschedule_dev
```

**Frontend:**
```bash
# Access shell
docker compose exec frontend sh
```

### Restart a Specific Service
```bash
docker compose restart backend
docker compose restart frontend
docker compose restart database
```

## Development Workflow

### Hot Reload

Both backend and frontend have hot reload enabled:
- **Backend:** Changes in `backend/src/` are automatically reloaded
- **Frontend:** Changes in `smart-schedule/` are automatically reloaded

### Database Migrations

Run migrations inside the backend container:
```bash
docker compose exec backend npx prisma migrate dev
```

Or push schema changes:
```bash
docker compose exec backend npx prisma db push
```

### Installing New Dependencies

**Backend:**
```bash
# Install on host (required for TypeScript/IDE support)
cd backend && npm install <package>

# Or install in container
docker compose exec backend npm install <package>
```

**Frontend:**
```bash
# Install on host (required for TypeScript/IDE support)
cd smart-schedule && npm install <package>

# Or install in container
docker compose exec frontend npm install <package>
```

**Important:** After installing dependencies, restart the container:
```bash
docker compose restart backend
docker compose restart frontend
```

## Troubleshooting

### Port Already in Use

If you get port conflict errors:

```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Linux/Mac:
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Stop conflicting services or change ports in .env
```

### Container Won't Start

1. **Check logs:**
   ```bash
   docker compose logs <service-name>
   ```

2. **Rebuild from scratch:**
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

3. **Check Docker resources:**
   - Ensure Docker Desktop has enough RAM (8GB+ recommended)
   - Check disk space: `docker system df`

### Database Connection Errors

1. **Verify database is healthy:**
   ```bash
   docker compose ps database
   ```

2. **Check database logs:**
   ```bash
   docker compose logs database
   ```

3. **Test connection:**
   ```bash
   docker compose exec database pg_isready -U smartschedule
   ```

### Frontend Can't Connect to Backend

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3001/healthz
   ```

2. **Check environment variables:**
   ```bash
   docker compose exec frontend env | grep API
   ```

3. **Verify network connectivity:**
   ```bash
   docker compose exec frontend ping backend
   ```

### Module Not Found Errors

If you see "Cannot find module" errors:

1. **Rebuild containers:**
   ```bash
   docker compose down
   docker compose up -d --build
   ```

2. **Reinstall dependencies in container:**
   ```bash
   docker compose exec backend npm ci
   docker compose exec frontend npm ci
   ```

### Reset Everything

**⚠️ Warning: This will delete all data**

```bash
# Stop and remove containers, volumes, and networks
docker compose down -v

# Remove all images (optional)
docker compose down --rmi all

# Rebuild from scratch
docker compose up -d --build
```

## Production Build

For production-like environment:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**Note:** Production compose file includes:
- Nginx reverse proxy
- Redis for caching/rate limiting
- Optimized production builds
- Security hardening

See `docker-compose.prod.yml` for configuration details.

## Environment Variables Reference

### Required for Docker Compose

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `smartschedule` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `dev_password` | PostgreSQL password |
| `POSTGRES_DB` | `smartschedule_dev` | Database name |
| `JWT_SECRET` | `dev-secret-key...` | JWT signing secret (min 32 chars) |
| `BACKEND_PORT` | `3001` | Backend API port |
| `FRONTEND_PORT` | `3000` | Frontend web port |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `ALLOWED_ORIGINS` | `http://localhost:3000,3001` | CORS allowed origins |

### Backend Environment Variables

Set in `backend/.env` (if running outside Docker) or via Docker Compose:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiration time (e.g., "7d") |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | Environment (development/production) |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend Environment Variables

Set in `smart-schedule/.env.local` (if running outside Docker) or via Docker Compose:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api suffix |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL |

## Data Persistence

- **Database:** Stored in Docker volume `postgres_data`
- **Node Modules:** Cached in anonymous volumes for faster rebuilds
- **Source Code:** Mounted from host for hot reload (not persisted in containers)

### Backup Database

```bash
# Export database
docker compose exec database pg_dump -U smartschedule smartschedule_dev > backup.sql

# Or use docker volume backup
docker run --rm -v smartschedule-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data
```

### Restore Database

```bash
# Restore from SQL dump
cat backup.sql | docker compose exec -T database psql -U smartschedule -d smartschedule_dev
```

## Next Steps

1. **Access the application** at http://localhost:3000
2. **Check health endpoints:**
   - Backend: http://localhost:3001/healthz
   - Frontend: http://localhost:3000/api/healthz
3. **Run tests:**
   - Backend: `docker compose exec backend npm test`
   - Frontend: `docker compose exec frontend npm test`
4. **View API documentation:** (if available) http://localhost:3001/api/docs

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Need help?** Check the logs first: `docker compose logs -f`




