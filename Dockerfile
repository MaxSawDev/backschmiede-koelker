# Dockerfile
# --- Build ---
FROM node:24.18.0-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Prisma Client generieren (braucht schema)
COPY prisma ./prisma
RUN npx prisma generate

# Quellcode
COPY . .

ARG NEXT_PUBLIC_BASE_ASSET_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_ASSET_URL=$NEXT_PUBLIC_BASE_ASSET_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV SKIP_DB_DURING_BUILD=1

# Next build (standalone)
RUN npm run build

# --- Runtime ---
FROM node:24.18.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_DB_DURING_BUILD=0

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Next standalone + static + public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Prisma: Schema + Engines + Client (für Query & Migrations)
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/generated ./generated
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

RUN mkdir -p /app/.next/cache /uploads \
  && chown -R node:node /app/.next/cache /uploads

EXPOSE 3000
USER node
CMD ["node", "server.js"]
