#!/bin/bash
# ============================================
# Docker Initialization Script
# Prepares Docker environment for SmartSchedule
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SmartSchedule Docker Initialization ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo "Please start Docker"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"

echo ""
echo -e "${BLUE}Setting up environment...${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from example...${NC}"
    cp env.docker.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    sed -i.bak "s/your-super-secret-jwt-key-min-32-chars-change-this-in-production/${JWT_SECRET}/" .env
    rm .env.bak 2>/dev/null || true
    
    # Generate random database password
    DB_PASSWORD=$(openssl rand -base64 16 2>/dev/null || date +%s | sha256sum | base64 | head -c 16)
    sed -i.bak "s/smartschedule_secure_password_change_in_production/${DB_PASSWORD}/" .env
    rm .env.bak 2>/dev/null || true
    
    echo -e "${GREEN}✓ Created .env file with secure random secrets${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create backup directory
mkdir -p backups
echo -e "${GREEN}✓ Created backups directory${NC}"

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Created logs directory${NC}"

echo ""
echo -e "${BLUE}Building Docker images...${NC}"
echo -e "${YELLOW}This may take several minutes on first run${NC}"
echo ""

docker-compose build --no-cache

echo ""
echo -e "${GREEN}✓ Docker images built successfully${NC}"

echo ""
echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

echo -e "${BLUE}Running database migrations...${NC}"
docker-compose exec -T backend npx prisma migrate deploy

echo ""
echo -e "${GREEN}╔════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete! 🎉                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Application URLs:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "  Health:    ${GREEN}http://localhost:3001/api/health${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  make logs          - View logs"
echo -e "  make status        - Check status"
echo -e "  make health        - Health checks"
echo -e "  make down          - Stop services"
echo -e "  make help          - Show all commands"
echo ""
echo -e "${YELLOW}Note: Edit .env file to customize configuration${NC}"
echo ""
