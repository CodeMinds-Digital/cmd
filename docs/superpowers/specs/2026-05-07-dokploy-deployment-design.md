# Dokploy Deployment Design for Codeminds Digital Website

**Date:** 2026-05-07  
**Project:** Codeminds Digital Agency Website  
**Branch:** development  
**Deployment Target:** Dokploy (Docker-based deployment)

## Problem Statement

The Next.js 16 agency website is experiencing a "bad gateway" error when deployed to Dokploy using Git auto-detection. The build completes successfully and logs show the server started, but the application is unreachable through the Dokploy proxy on port 3000.

**Root cause:** Dokploy's auto-detection doesn't correctly identify how to start a Next.js production server, resulting in an improperly configured runtime environment.

## Solution Overview

Implement explicit Docker-based deployment using a multi-stage Dockerfile that clearly defines the build and runtime process. This approach eliminates ambiguity in the deployment pipeline and follows Next.js production best practices.

**Reference:** This design is based on the working eAI-two project at `/Users/naveenselvam/Desktop/pair_programming/claude-code/evaluation/eAI-two/`, which successfully deploys the same stack (Next.js + TypeScript) to Dokploy.

## Architecture

### Multi-Stage Docker Build

**Stage 1: Base**
- Node.js 20-alpine base image
- Minimal footprint for faster builds

**Stage 2: Dependencies**
- Install all dependencies via `npm ci`
- Uses package-lock.json for reproducible builds
- Includes `libc6-compat` for Alpine compatibility with Next.js

**Stage 3: Builder**
- Copies dependencies from stage 1
- Runs `npm run build` to create production assets
- Generates standalone output at `.next/standalone/`
- Disables Next.js telemetry

**Stage 4: Runner (Production)**
- Minimal runtime image with only production dependencies
- Non-root user (`nextjs:nodejs`) for security
- Copies standalone server and static assets
- Exposes port 3000
- Runs `node server.js` (Next.js standalone server)

### Key Configuration Changes

**1. next.config.js**
Add two critical settings:

```javascript
output: 'standalone'
```
Enables Next.js standalone output mode, which creates a minimal production bundle with only required dependencies.

```javascript
outputFileTracingExcludes: {
  '*': ['docs/**', 'backups/**', '.superpowers/**', '.qodo/**']
}
```
Excludes documentation and backup folders from file tracing to prevent ENOENT errors during standalone build.

**2. .dockerignore**
Excludes unnecessary files from Docker build context:
- node_modules (rebuilt in container)
- .next (rebuilt during build stage)
- .env files (injected via Dokploy UI)
- Git and IDE files
- Build artifacts

**3. dokploy.json (Optional)**
Provides explicit configuration for Dokploy:
- Build command: `npm run build`
- Start command: `npm run start`
- Port: 3000
- Health check: Root path `/` with 30s interval
- Resource limits: 1GB memory, 1 CPU core

## Deployment Process

### Build Flow

1. Developer pushes code to development branch
2. Dokploy detects Dockerfile in repository root
3. Docker builds image using multi-stage process:
   - Stage 1: Install dependencies
   - Stage 2: Build Next.js application
   - Stage 3: Create minimal runtime image
4. Image tagged and pushed to Dokploy's internal registry

### Runtime Flow

1. Container starts with `node server.js`
2. Next.js standalone server listens on `0.0.0.0:3000`
3. Dokploy's reverse proxy routes traffic to container
4. Health check pings `/` every 30 seconds
5. If health check passes for 3 consecutive attempts, traffic is routed

### Environment Variables

**Build-time variables:**
- `NEXT_TELEMETRY_DISABLED=1` (set in Dockerfile)
- Any `NEXT_PUBLIC_*` variables (baked into bundle)

**Runtime variables (configured in Dokploy UI):**
- Email credentials for Nodemailer contact form:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `SMTP_FROM`
- `NODE_ENV=production` (set by Docker)

## Differences from eAI-two Reference

The eAI-two project includes complex system dependencies for PDF processing (poppler-utils, cairo, pango, canvas). The CMD project is simpler:

**Removed dependencies:**
- poppler-utils (PDF conversion)
- cairo, pango, pixman (canvas rendering)
- Build tools (g++, make, python3)

**Kept from reference:**
- Multi-stage build pattern
- Standalone output mode
- Non-root user security
- Health check configuration
- Same Node version strategy (20-alpine for Next.js 16)

## Health Check Strategy

**Endpoint:** `/` (root route)  
**Method:** HTTP GET  
**Interval:** 30 seconds  
**Timeout:** 10 seconds  
**Retries:** 3 attempts before marking unhealthy

**Why not a dedicated `/api/health` endpoint?**
- Adds unnecessary complexity for this deployment
- Root route already validates that Next.js server is responding
- If we need more detailed health metrics later, we can add it

## Fixing the Bad Gateway Error

**Current state:**
- Dokploy auto-detection doesn't know how to start Next.js production server
- Server may be starting on wrong interface (localhost vs 0.0.0.0)
- Or server isn't starting at all due to missing standalone output

**After deployment:**
- Dockerfile explicitly runs `node server.js` from standalone output
- Server binds to `0.0.0.0:3000` (accessible from outside container)
- Dokploy proxy can reach the container on port 3000
- Health check validates server is responding
- Bad gateway error is resolved

## Testing & Verification

**After deployment, verify:**

1. **Build logs** - Check Dokploy build logs for successful completion
2. **Container logs** - Should see "Ready on http://0.0.0.0:3000"
3. **Health check** - Should show green/healthy status in Dokploy UI
4. **Application access** - Visit the Dokploy-provided URL, should load the homepage
5. **Functionality** - Test contact form (requires SMTP env vars configured)
6. **Animation performance** - Verify WebGL shader, Lenis smooth scroll, Framer Motion work

## Rollback Plan

Dokploy maintains zero-downtime deployments:
1. New container is built and health-checked before traffic switches
2. If health check fails, old container stays active
3. Manual rollback via Dokploy UI if needed (select previous deployment)

## Resource Requirements

**Based on eAI-two reference:**
- Memory: 1024Mi (1GB)
- CPU: 1000m (1 core)

These are conservative estimates. The CMD project is lighter (no PDF processing), so it may use less. Monitor after deployment and adjust if needed.

## Security Considerations

**Container security:**
- Non-root user (nextjs:nodejs with UID/GID 1001)
- Minimal Alpine base (smaller attack surface)
- No unnecessary system packages

**Environment variables:**
- Never commit sensitive values to Git
- All secrets configured in Dokploy UI
- .env files excluded via .dockerignore

**Next.js security headers:**
- Already configured in next.config.js
- CSP, X-Frame-Options, HSTS, etc.

## Performance Optimizations

**Bundle splitting:**
- Three.js + r3f + drei in separate chunks (~187 KB gzipped)
- Lazy-loaded when HeroCanvas mounts (capability-gated)

**Standalone output:**
- Only includes required dependencies
- Smaller container size vs full node_modules
- Faster startup time

**Static asset optimization:**
- AVIF/WebP images via next/image
- Self-hosted fonts (Geist, Geist Mono, Instrument Serif)
- Automatic code splitting via Next.js

## Success Criteria

Deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Container starts and logs show "Ready on http://0.0.0.0:3000"
3. ✅ Health check passes (green status in Dokploy)
4. ✅ Website loads at Dokploy-provided URL
5. ✅ No bad gateway errors
6. ✅ Contact form submits successfully (with SMTP configured)
7. ✅ Animations and WebGL shader work as expected
8. ✅ Performance targets met (LCP < 1.8s, INP < 200ms)

## Next Steps

After this design is approved:

1. Create implementation plan with specific file changes
2. Add Dockerfile adapted from eAI-two reference
3. Create .dockerignore file
4. Update next.config.js with standalone output
5. Add dokploy.json for explicit configuration
6. Commit changes to development branch
7. Push to trigger Dokploy rebuild
8. Monitor deployment and verify success criteria
9. Configure SMTP environment variables in Dokploy UI
10. Test production deployment thoroughly
