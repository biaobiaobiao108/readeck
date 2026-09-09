# Build stage
FROM oven/bun:alpine AS builder
WORKDIR /app

COPY package.json tsconfig.json bun.lock ./
COPY packages ./packages
COPY apps ./apps

# Install all dependencies, build SPA, then prune to production dependencies
RUN bun install --frozen-lockfile && \
    bun run build && \
    rm -rf node_modules && \
    bun install --frozen-lockfile --production

# Production runtime stage
FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8000 \
    DATABASE_PATH=/app/data/readeck.sqlite

COPY package.json tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/apps/web/dist ./apps/web/dist

RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 8000

CMD ["bun", "apps/server/src/index.ts"]
