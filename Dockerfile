# Multi-stage build for Nuxt 3
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and lockfile for better layer caching
COPY package.json package-lock.json* .npmrc ./

# Install dependencies
RUN npm ci --loglevel warn 2>&1

# Copy source
COPY . .

# Build Nuxt
RUN npm run build

# ── Production stage ─────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built output + node_modules (needed because externals.trace is disabled)
COPY --from=builder /app/.output .output
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json .

# Expose port 3000 (Nuxt default)
EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
