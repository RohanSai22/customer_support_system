# API Dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY packages/db/package.json ./packages/db/
COPY packages/agents/package.json ./packages/agents/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd apps/api && bun run build

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
