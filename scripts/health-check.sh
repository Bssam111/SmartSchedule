#!/bin/bash
# ============================================
# Health Check Script
# Verifies all services are running correctly
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SmartSchedule Health Check          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

FAILED=0

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local max_attempts=5
    local attempt=1
    
    echo -n "Checking ${name}... "
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Healthy${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}✗ Unhealthy${NC}"
    FAILED=1
    return 1
}

# Function to check container status
check_container() {
    local name=$1
    echo -n "Checking container ${name}... "
    
    if docker ps --filter "name=${name}" --filter "status=running" | grep -q "${name}"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        FAILED=1
        return 1
    fi
}

# Check Docker containers
echo -e "${BLUE}Container Status:${NC}"
check_container "smartschedule-db"
check_container "smartschedule-backend"
check_container "smartschedule-frontend"
echo ""

# Check HTTP endpoints
echo -e "${BLUE}Service Health:${NC}"
check_http "Backend API" "http://localhost:3001/api/health"
check_http "Backend Database Connection" "http://localhost:3001/api/health/db"
check_http "Frontend" "http://localhost:3000/api/health"
echo ""

# Check database connectivity
echo -e "${BLUE}Database Connectivity:${NC}"
echo -n "Testing PostgreSQL connection... "
if docker-compose exec -T database pg_isready -U smartschedule > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
    FAILED=1
fi
echo ""

# Check Docker network
echo -e "${BLUE}Network Status:${NC}"
echo -n "Checking Docker network... "
if docker network inspect smartschedule-network > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Network exists${NC}"
else
    echo -e "${RED}✗ Network not found${NC}"
    FAILED=1
fi
echo ""

# Check volumes
echo -e "${BLUE}Volume Status:${NC}"
echo -n "Checking data volume... "
if docker volume inspect smartschedule-postgres-data > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Volume exists${NC}"
else
    echo -e "${RED}✗ Volume not found${NC}"
    FAILED=1
fi
echo ""

# Resource usage
echo -e "${BLUE}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
    smartschedule-frontend smartschedule-backend smartschedule-db 2>/dev/null || echo -e "${YELLOW}Unable to retrieve stats${NC}"
echo ""

# Final status
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  All checks passed! ✓              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════╗${NC}"
    echo -e "${RED}║  Some checks failed! ✗             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "1. Check logs: docker-compose logs"
    echo "2. Restart services: docker-compose restart"
    echo "3. Rebuild: docker-compose down && docker-compose up -d --build"
    exit 1
fi
