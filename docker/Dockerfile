# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/whatsapp/package.json ./packages/whatsapp/
COPY packages/ai/package.json ./packages/ai/
COPY packages/excel/package.json ./packages/excel/
COPY packages/audit/package.json ./packages/audit/
COPY packages/tests/package.json ./packages/tests/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DOCKER_BUILD=true
RUN pnpm db:generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
USER nextjs
EXPOSE 4000
ENV PORT=4000
CMD ["node", "apps/dashboard/server.js"]
