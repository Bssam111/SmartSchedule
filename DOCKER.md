# Docker Deployment Guide - SmartSchedule

This guide covers Docker deployment for the SmartSchedule application, including both development and production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Database Management](#database-management)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

---

## 🚀 Prerequisites

- Docker Engine 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Compose](https://docs.docker.com/compose/install/))
- Make (optional, for convenience commands)

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## ⚡ Quick Start

### 1. Setup Environment Variables

```bash
# Copy example environment file
cp env.docker.example .env

# Edit .env and set secure values
# IMPORTANT: Change JWT_SECRET and POSTGRES_PASSWORD in production!
```

### 2. Start Services

**Using Make (recommended):**
```bash
make build    # Build images
make up       # Start services
```

**Using Docker Compose directly:**
```bash
docker-compose build
docker-compose up -d
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### 4. Run Database Migrations

```bash
make migrate
# Or: docker-compose exec backend npx prisma migrate deploy
```

---

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   PostgreSQL    │
│   Next.js       │     │   Express API   │     │   Database      │
│   Port: 3000    │     │   Port: 3001    │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      │                         │                         │
      └─────────────────────────┴─────────────────────────┘
                    smartschedule-network
```

### Services

1. **Frontend (Next.js)**
   - Multi-stage build for optimal size
   - Standalone output mode
   - Non-root user (nextjs)
   - Health checks enabled

2. **Backend (Express + TypeScript)**
   - Multi-stage build
   - Prisma ORM
   - Non-root user (nodejs)
   - Health checks enabled

3. **Database (PostgreSQL 16)**
   - Alpine-based image
   - Persistent volume storage
   - Health checks enabled

---

## ⚙️ Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Database
POSTGRES_USER=smartschedule
POSTGRES_PASSWORD=<change-me>
POSTGRES_DB=smartschedule

# Security
JWT_SECRET=<min-32-chars-change-me>

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_PORT=5432

# URLs
NEXT_PUBLIC_API_URL=http://backend:3001        # Internal
NEXT_PUBLIC_EXTERNAL_API_URL=http://localhost:3001  # Browser
```

### Port Mapping

| Service  | Container | Host   | Customizable |
|----------|-----------|--------|--------------|
| Frontend | 3000      | 3000   | ✅ FRONTEND_PORT |
| Backend  | 3001      | 3001   | ✅ BACKEND_PORT  |
| Database | 5432      | 5432   | ✅ POSTGRES_PORT |

---

## 🛠️ Development Setup

Development mode includes hot-reload for faster iteration.

### Start Development Environment

```bash
make dev
# Or: docker-compose -f docker-compose.dev.yml up -d
```

### View Logs

```bash
make dev-logs
# Or: docker-compose -f docker-compose.dev.yml logs -f
```

### Stop Development Environment

```bash
make dev-down
# Or: docker-compose -f docker-compose.dev.yml down
```

### Development Features

- ✅ Hot-reload for frontend and backend
- ✅ Source code mounted as volumes
- ✅ Automatic Prisma regeneration
- ✅ Development database (separate from production)
- ✅ Relaxed rate limiting

---

## 🚢 Production Deployment

### Build Production Images

```bash
make build
# Or: docker-compose build --no-cache
```

### Deploy

```bash
make prod
# Or: docker-compose up -d --build
```

### Production Checklist

- [ ] Change `JWT_SECRET` to secure random value (min 32 chars)
- [ ] Change `POSTGRES_PASSWORD` to secure password
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS with specific frontend URL
- [ ] Enable HTTPS via reverse proxy (Nginx/Traefik)
- [ ] Set up log aggregation
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts

### Recommended Production Setup

Use a reverse proxy (Nginx, Traefik, Caddy) for:
- HTTPS/TLS termination
- Load balancing
- Rate limiting
- Static file serving

Example Nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 💾 Database Management

### Run Migrations

```bash
make migrate
# Or: docker-compose exec backend npx prisma migrate deploy
```

### Create New Migration

```bash
docker-compose exec backend npx prisma migrate dev --name migration_name
```

### Seed Database

```bash
make seed
# Or: docker-compose exec backend npm run db:seed
```

### Open Prisma Studio

```bash
make prisma-studio
# Or: docker-compose exec backend npx prisma studio
```

Access at: http://localhost:5555

### Backup Database

```bash
make backup-db
# Or: docker-compose exec database pg_dump -U smartschedule smartschedule > backup.sql
```

### Restore Database

```bash
make restore-db
# Or: docker-compose exec -T database psql -U smartschedule smartschedule < backup.sql
```

### Direct Database Access

```bash
make shell-db
# Or: docker-compose exec database psql -U smartschedule -d smartschedule
```

---

## 📊 Monitoring & Health Checks

### Check Service Status

```bash
make status
# Or: docker-compose ps
```

### Health Checks

```bash
make health
```

Manual health checks:
```bash
# Backend health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/db

# Frontend health
curl http://localhost:3000/api/health
```

### View Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-frontend
make logs-db
```

### Resource Usage

```bash
# View container stats
docker stats

# Inspect specific container
docker stats smartschedule-backend
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Solution**:
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in .env
FRONTEND_PORT=3001
```

#### 2. Database Connection Failed

**Error**: "Can't reach database server"

**Solution**:
```bash
# Check database health
docker-compose logs database

# Restart database
docker-compose restart database

# Wait for database to be ready
docker-compose exec backend sh -c 'until pg_isready -h database; do sleep 1; done'
```

#### 3. Prisma Client Not Generated

**Error**: "@prisma/client did not initialize yet"

**Solution**:
```bash
# Regenerate Prisma client
docker-compose exec backend npx prisma generate

# Restart backend
docker-compose restart backend
```

#### 4. Next.js Build Fails

**Error**: "standalone output not found"

**Solution**:
```bash
# Ensure next.config.ts has output: 'standalone'
# Rebuild images
make rebuild
```

#### 5. Permission Denied

**Error**: "permission denied" when accessing volumes

**Solution**:
```bash
# Fix volume permissions
docker-compose down
docker volume rm smartschedule-postgres-data
make up
```

### Debug Mode

Enable verbose logging:
```bash
# Backend
docker-compose exec backend sh -c 'export DEBUG=* && node dist/server.js'

# View all container logs
docker-compose logs --tail=100 -f
```

### Clean Slate

If all else fails:
```bash
make clean    # Remove all containers, volumes, images
make build    # Rebuild from scratch
make up       # Start fresh
```

---

## 🔒 Security Considerations

### Production Security Checklist

- [x] **Multi-stage builds**: Minimizes attack surface
- [x] **Non-root users**: Services run as non-root (nodejs/nextjs)
- [x] **Health checks**: Automatic restart on failure
- [x] **Alpine base images**: Smaller, fewer vulnerabilities
- [ ] **Secrets management**: Use Docker secrets or vault (not .env in production)
- [ ] **Network isolation**: Separate networks for frontend/backend/database
- [ ] **Rate limiting**: Configured in backend
- [ ] **HTTPS**: Use reverse proxy with TLS
- [ ] **Security headers**: Helmet.js configured in backend
- [ ] **Input validation**: Zod schemas in use
- [ ] **SQL injection prevention**: Prisma parameterized queries
- [ ] **XSS prevention**: React auto-escaping + CSP headers
- [ ] **CSRF protection**: Token-based authentication

### OWASP Top 10 Coverage

| Risk | Mitigation |
|------|------------|
| A01 - Broken Access Control | JWT auth, role-based access |
| A02 - Cryptographic Failures | bcrypt password hashing, HTTPS |
| A03 - Injection | Prisma ORM, Zod validation |
| A04 - Insecure Design | Secure architecture, defense in depth |
| A05 - Security Misconfiguration | Helmet.js, secure defaults |
| A06 - Vulnerable Components | Regular dependency updates |
| A07 - Auth Failures | JWT with expiry, secure sessions |
| A08 - Data Integrity | Input validation, checksums |
| A09 - Logging Failures | Structured logging, monitoring |
| A10 - SSRF | Input validation, URL allowlisting |

### Environment Security

**Never commit these files:**
```
.env
.env.local
.env.production
*.pem
*.key
secrets/
```

**Use Docker secrets in production:**
```yaml
services:
  backend:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

---

## 📝 Makefile Commands Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make build` | Build all Docker images |
| `make up` | Start production environment |
| `make down` | Stop all services |
| `make restart` | Restart all services |
| `make dev` | Start development environment |
| `make logs` | View all service logs |
| `make migrate` | Run database migrations |
| `make seed` | Seed database |
| `make shell-backend` | Open backend shell |
| `make shell-frontend` | Open frontend shell |
| `make shell-db` | Open database shell |
| `make test` | Run tests |
| `make clean` | Remove all resources |
| `make status` | Show service status |
| `make health` | Check health endpoints |
| `make backup-db` | Backup database |
| `make restore-db` | Restore from backup |

---

## 🔧 Advanced Configuration

### Custom Network

```yaml
networks:
  smartschedule-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Logging Configuration

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Prisma in Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

---

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- GitHub Issues: [Create Issue](https://github.com/yourusername/smartschedule/issues)
- Documentation: [Project README](./README.md)

---

**Last Updated**: October 2025
