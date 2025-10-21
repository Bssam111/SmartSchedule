# 🐳 Docker Quick Start Guide

Get SmartSchedule running in Docker in under 5 minutes!

## Prerequisites

- Docker Desktop installed and running
- 4GB RAM available
- 10GB disk space

## Quick Setup

### Option 1: Automated Setup (Recommended)

**Linux/Mac:**
```bash
./scripts/docker-init.sh
```

**Windows:**
```powershell
.\scripts\docker-init.bat
```

### Option 2: Manual Setup

```bash
# 1. Create environment file
cp env.docker.example .env

# 2. Build and start services
docker-compose up -d --build

# 3. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Check health
curl http://localhost:3001/api/health
```

### Option 3: Using Make (Linux/Mac)

```bash
make build    # Build images
make up       # Start services
make migrate  # Run migrations
make health   # Check health
```

## Access Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js application |
| Backend API | http://localhost:3001 | Express REST API |
| Health Check | http://localhost:3001/api/health | API health status |
| Database | localhost:5432 | PostgreSQL (internal) |

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Check status
docker-compose ps

# Run health checks
./scripts/health-check.sh  # Linux/Mac
.\scripts\health-check.bat # Windows
```

## Development Mode

For hot-reload during development:

```bash
# Start dev environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop dev environment
docker-compose -f docker-compose.dev.yml down
```

Or with Make:
```bash
make dev        # Start dev mode
make dev-logs   # View logs
make dev-down   # Stop dev mode
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Change port in .env
FRONTEND_PORT=3001
```

### Database Connection Failed
```bash
# Check database status
docker-compose logs database

# Restart database
docker-compose restart database
```

### Clean Slate
```bash
# Remove everything and start fresh
make clean  # Or: docker-compose down -v --rmi all
make build
make up
```

## Next Steps

- Read full documentation: [DOCKER.md](./DOCKER.md)
- Configure environment: Edit `.env` file
- Set up production: Follow security checklist in DOCKER.md
- Monitor services: `make status` and `make health`

## Support

- 📖 Full docs: [DOCKER.md](./DOCKER.md)
- 🐛 Issues: Check troubleshooting section
- 💬 Help: Run `make help` for all commands

---

**Security Note**: The default `.env` file contains development credentials. **Always change these in production!**

Required changes for production:
- `JWT_SECRET` - Use 32+ character random string
- `POSTGRES_PASSWORD` - Use strong password
- `NODE_ENV=production`
- Enable HTTPS via reverse proxy
