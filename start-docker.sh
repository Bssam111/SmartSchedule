#!/bin/bash
# SmartSchedule Docker Development Stack Startup Script
# Run this script to start the entire development environment

set -e

echo "========================================"
echo "SmartSchedule Docker Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}Using docker-compose.dev.yml...${NC}"
    COMPOSE_FILE="docker-compose.dev.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Stop and remove existing containers
echo -e "${YELLOW}Cleaning up existing containers...${NC}"
docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
echo "This may take a few minutes on first run..."
docker compose -f "$COMPOSE_FILE" up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Containers started successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    sleep 10
    
    echo ""
    echo -e "${CYAN}Container Status:${NC}"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Access the application:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:3001${NC}"
    echo -e "  Health:   ${GREEN}http://localhost:3001/healthz${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}To view logs:${NC}"
    echo "  docker compose -f $COMPOSE_FILE logs -f"
    echo ""
    echo -e "${YELLOW}To stop containers:${NC}"
    echo "  docker compose -f $COMPOSE_FILE down"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Failed to start containers. Check the errors above.${NC}"
    exit 1
fi




