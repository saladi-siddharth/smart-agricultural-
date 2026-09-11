# FarmPilot Enterprise Production Multi-Stage Dockerfile
# Stage 1: Build & Assets Compilation
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies for build step
RUN npm ci

# Copy application source code
COPY . .

# Run bundle builder
RUN node build.js

# Prune devDependencies for lean runtime
RUN npm prune --production

# Stage 2: Hardened Secure Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

# Security: Create logs directory and assign permissions to non-root node user
RUN mkdir -p /app/logs && chown -R node:node /app

# Copy production dependencies and application files from builder
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app ./

# Security: Run as non-privileged node user (CIS Docker Benchmark)
USER node

# Expose HTTP port
EXPOSE 5173

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/api/health || exit 1

# Launch Enterprise FarmPilot Engine
CMD ["node", "server.js"]

