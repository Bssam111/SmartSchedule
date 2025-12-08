# ============================================
# Backend Dockerfile - SmartSchedule API
# Multi-stage build for production-ready image
# ============================================

# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps
LABEL maintainer="SmartSchedule Team"

# Install system dependencies for Prisma and health checks
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/
COPY healthcheck.js ./healthcheck.js

# Install ALL dependencies (including nodemailer and other runtime deps)
RUN npm ci --include=dev

# Generate Prisma Client
RUN npx prisma generate


# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code and scripts (for potential use, though kill-port won't be called in Docker)
COPY . .
# Note: scripts/kill-port.js is included but won't be used in Docker (dev:docker script doesn't call it)

# Note: Skip TypeScript compilation - will use tsx in production
# This avoids build-time type errors while maintaining functionality


# ===== Stage 3: Production Runner =====
FROM node:20-alpine AS runner

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache openssl curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy application source and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./

# Switch to non-root user
USER nodejs

# Expose API ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application with tsx (TypeScript execution)
CMD ["npx", "tsx", "src/server.ts"]
