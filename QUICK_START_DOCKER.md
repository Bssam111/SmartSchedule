# Quick Start - Docker 🐳

Get SmartSchedule running locally in 3 simple steps!

## Prerequisites

✅ Docker Desktop installed and running  
✅ Ports 3000, 3001, and 5432 available

## Step 1: Start Everything

**Windows:**
```powershell
.\start-docker.ps1
```

**Linux/Mac:**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

**Or manually:**
```bash
docker compose up -d --build
```

## Step 2: Wait for Services

Give it 30-60 seconds for all services to start. Check status:

```bash
docker compose ps
```

## Step 3: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/healthz

## That's It! 🎉

Your SmartSchedule application is now running locally in Docker.

### Quick Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Clean everything (⚠️ deletes database)
docker compose down -v
```

### Troubleshooting

**Port conflicts?**
- Stop other services using ports 3000, 3001, or 5432
- Or change ports in `.env` file

**Containers won't start?**
```bash
docker compose logs -f
```

**Need more help?**
See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed documentation.




