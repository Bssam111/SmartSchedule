# ============================================
# Frontend Dockerfile - Next.js 15
# Multi-stage build for development
# ============================================

# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps
LABEL maintainer="SmartSchedule Team"

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client if needed
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate || true; fi

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Build Next.js app (skip in dev mode, will use dev server)
# RUN npm run build

# ===== Stage 3: Development Runner =====
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy application files
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nodejs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/tailwind.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/postcss.config.mjs ./
COPY --from=builder --chown=nodejs:nodejs /app/app ./app
COPY --from=builder --chown=nodejs:nodejs /app/components ./components
COPY --from=builder --chown=nodejs:nodejs /app/lib ./lib
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose Next.js port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start Next.js dev server
CMD ["npm", "run", "dev"]

