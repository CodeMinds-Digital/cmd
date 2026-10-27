# syntax=docker/dockerfile:1.10
# Admin app (admin.codeminds.digital). Build from the REPO ROOT so the shared
# workspace package is available:  docker build -f admin/Dockerfile .
# Every page renders per request, so the build needs no Appwrite access;
# all configuration is runtime environment (see the plan's deploy checklist).
FROM node:24-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Root + every npm workspace manifest, so `npm ci` can link them.
COPY package.json package-lock.json ./
COPY packages/cms/package.json ./packages/cms/
COPY admin/package.json ./admin/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w admin

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Standalone output is traced from the repo root, so the server sits in admin/.
COPY --from=builder --chown=nextjs:nodejs /app/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/admin/.next/static ./admin/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null || exit 1
CMD ["node", "admin/server.js"]
