# ============================================
# SmartSchedule Docker Management Makefile
# Simplifies common Docker operations
# ============================================

.PHONY: help build up down restart logs clean dev prod migrate seed shell-backend shell-frontend shell-db test

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

## help: Show this help message
help:
	@echo "$(BLUE)SmartSchedule Docker Management$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^## [a-zA-Z_-]+:' $(MAKEFILE_LIST) | \
		sed 's/^## //' | \
		awk 'BEGIN {FS = ":"}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

## build: Build all Docker images
build:
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build --no-cache

## up: Start all services (production)
up:
	@echo "$(GREEN)Starting SmartSchedule services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:3001"

## down: Stop all services
down:
	@echo "$(YELLOW)Stopping SmartSchedule services...$(NC)"
	docker-compose down

## restart: Restart all services
restart: down up

## logs: View logs from all services
logs:
	docker-compose logs -f

## logs-backend: View backend logs only
logs-backend:
	docker-compose logs -f backend

## logs-frontend: View frontend logs only
logs-frontend:
	docker-compose logs -f frontend

## logs-db: View database logs only
logs-db:
	docker-compose logs -f database

## dev: Start development environment with hot-reload
dev:
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo "Frontend: http://localhost:3000 (hot-reload enabled)"
	@echo "Backend: http://localhost:3001 (hot-reload enabled)"

## dev-logs: View development environment logs
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

## dev-down: Stop development environment
dev-down:
	docker-compose -f docker-compose.dev.yml down

## prod: Deploy production environment
prod:
	@echo "$(GREEN)Deploying production environment...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)Production environment deployed!$(NC)"

## migrate: Run database migrations
migrate:
	@echo "$(BLUE)Running database migrations...$(NC)"
	docker-compose exec backend npx prisma migrate deploy

## migrate-dev: Run database migrations in dev mode
migrate-dev:
	@echo "$(BLUE)Running database migrations (dev)...$(NC)"
	docker-compose exec backend npx prisma migrate dev

## seed: Seed the database
seed:
	@echo "$(BLUE)Seeding database...$(NC)"
	docker-compose exec backend npm run db:seed

## shell-backend: Open shell in backend container
shell-backend:
	@echo "$(BLUE)Opening backend shell...$(NC)"
	docker-compose exec backend sh

## shell-frontend: Open shell in frontend container
shell-frontend:
	@echo "$(BLUE)Opening frontend shell...$(NC)"
	docker-compose exec frontend sh

## shell-db: Open PostgreSQL shell
shell-db:
	@echo "$(BLUE)Opening database shell...$(NC)"
	docker-compose exec database psql -U smartschedule -d smartschedule

## prisma-studio: Open Prisma Studio
prisma-studio:
	@echo "$(BLUE)Opening Prisma Studio...$(NC)"
	docker-compose exec backend npx prisma studio

## test: Run tests
test:
	@echo "$(BLUE)Running tests...$(NC)"
	docker-compose exec backend npm test

## clean: Remove all containers, volumes, and images
clean:
	@echo "$(RED)Cleaning up Docker resources...$(NC)"
	docker-compose down -v --rmi all --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --rmi all --remove-orphans
	@echo "$(GREEN)Cleanup complete!$(NC)"

## status: Show status of all services
status:
	@echo "$(BLUE)Service Status:$(NC)"
	@docker-compose ps

## health: Check health of all services
health:
	@echo "$(BLUE)Health Checks:$(NC)"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@curl -sf http://localhost:3001/api/health/db > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend:$(NC)"
	@curl -sf http://localhost:3001/api/health > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -sf http://localhost:3000/api/health > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"

## rebuild: Rebuild and restart all services
rebuild:
	@echo "$(YELLOW)Rebuilding services...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)Rebuild complete!$(NC)"

## backup-db: Backup database
backup-db:
	@echo "$(BLUE)Backing up database...$(NC)"
	@mkdir -p backups
	docker-compose exec -T database pg_dump -U smartschedule smartschedule > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)Backup saved to backups/$(NC)"

## restore-db: Restore database from latest backup
restore-db:
	@echo "$(YELLOW)Restoring database from latest backup...$(NC)"
	@LATEST=$$(ls -t backups/*.sql | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "$(RED)No backups found!$(NC)"; \
		exit 1; \
	fi; \
	echo "Restoring from $$LATEST"; \
	docker-compose exec -T database psql -U smartschedule smartschedule < $$LATEST
	@echo "$(GREEN)Database restored!$(NC)"
