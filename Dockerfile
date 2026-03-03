# Multi-stage build for Nuxt 3
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build Nuxt
RUN npm run build

# ── Production stage ─────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built output
COPY --from=builder /app/.output .output
COPY --from=builder /app/package.json .
# Include seed.sql for auto-seed on first boot
COPY --from=builder /app/scripts/seed.sql seed.sql

# Expose port 3000 (Nuxt default)
EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
