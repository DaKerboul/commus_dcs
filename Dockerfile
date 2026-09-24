# Multi-stage build for Nuxt 3
FROM node:22-alpine AS builder

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
FROM node:22-alpine AS runner

WORKDIR /app

# Fonts for server-side SVG rasterising (share cards on /api/og) — without them
# librsvg renders the text as nothing. Installed before dropping root.
RUN apk add --no-cache fontconfig font-dejavu

# Switch to non-root user before any writes (node uid=1000 provided by node:22-alpine)
RUN chown node:node /app
USER node

# Install production deps only — devDeps (vitest, drizzle-kit, typescript…) are not needed at runtime.
# --ignore-scripts skips `nuxt prepare` (postinstall) which requires the full source tree.
# npm rebuild sharp runs sharp's native binary download separately (linuxmusl-x64 for Alpine).
COPY --chown=node:node package.json package-lock.json* .npmrc ./
# The rebuild downloads sharp's prebuilt binary from GitHub, which times out now
# and then from this network (deploy 270, 2026-09-24): retry before failing.
RUN npm ci --omit=dev --ignore-scripts --loglevel warn 2>&1 \
    && for attempt in 1 2 3 4; do \
         npm rebuild sharp --loglevel warn 2>&1 && break; \
         [ "$attempt" = 4 ] && exit 1; \
         echo "sharp rebuild failed (attempt $attempt), retrying..."; sleep $((attempt * 10)); \
       done

# Copy built Nitro output and versioned migrations (needed by the startup migrate runner)
COPY --chown=node:node --from=builder /app/.output .output
COPY --chown=node:node --from=builder /app/server/db/migrations ./server/db/migrations

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
