# syntax=docker/dockerfile:1
FROM node:18-alpine AS base

WORKDIR /app

# Install production dependencies only in a separate layer for caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

# ── Development / test stage ──────────────────────────────────────────────────
FROM base AS development
RUN npm ci
ENV NODE_ENV=development
EXPOSE 3000
CMD ["node", "src/index.js"]

# ── Production stage ──────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
