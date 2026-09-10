# FarmPilot Production Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Build production bundle
RUN node build.js

# Expose server port
EXPOSE 5173

# Runtime environment
ENV PORT=5173
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/api/health || exit 1

# Start the enterprise server
CMD ["node", "server.js"]
