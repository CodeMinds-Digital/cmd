# syntax=docker/dockerfile:1.10
# Node.js 24 LTS (Alpine). Node 20 reached end-of-life in April 2026.
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files (root + npm workspace manifests, so `npm ci` can link them)
COPY package.json package-lock.json ./
COPY packages/cms/package.json ./packages/cms/
COPY admin/package.json ./admin/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for build
ENV NEXT_TELEMETRY_DISABLED=1

# Pages are prerendered from Appwrite content, so the build needs Appwrite.
# Public identifiers come in as Dokploy "Build Time Arguments"…
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT \
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=$NEXT_PUBLIC_APPWRITE_DATABASE_ID

# …and the API key as a Dokploy "Build-time Secret": mounted for this step
# only, never written to an image layer or the build history.
RUN --mount=type=secret,id=APPWRITE_API_KEY,env=APPWRITE_API_KEY \
    npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Liveness: the home page is statically prerendered, so this is cheap.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", "server.js"]
