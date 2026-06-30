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

# Switch to non-root user before any writes (node uid=1000 provided by node:20-alpine)
RUN chown node:node /app
USER node

# Install production deps only — devDeps (vitest, drizzle-kit, typescript…) are not needed at runtime.
# --ignore-scripts skips `nuxt prepare` (postinstall) which requires the full source tree.
# npm rebuild sharp runs sharp's native binary download separately (linuxmusl-x64 for Alpine).
COPY --chown=node:node package.json package-lock.json* .npmrc ./
RUN npm ci --omit=dev --ignore-scripts --loglevel warn 2>&1 \
    && npm rebuild sharp --loglevel warn 2>&1

# Copy built Nitro output and versioned migrations (needed by the startup migrate runner)
COPY --chown=node:node --from=builder /app/.output .output
COPY --chown=node:node --from=builder /app/server/db/migrations ./server/db/migrations

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
