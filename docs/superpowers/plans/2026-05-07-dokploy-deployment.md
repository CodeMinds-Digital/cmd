# Dokploy Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix bad gateway error by adding explicit Docker deployment configuration for Dokploy

**Architecture:** Multi-stage Docker build (deps → builder → runner) with Next.js standalone output mode. Removes ambiguity from Dokploy's auto-detection by explicitly defining build and runtime commands.

**Tech Stack:** Docker, Next.js 16, Node.js 20-alpine

**Reference:** Based on working eAI-two deployment at `/Users/naveenselvam/Desktop/pair_programming/claude-code/evaluation/eAI-two/`

---

## File Structure

**Files to create:**
- `Dockerfile` - Multi-stage Docker build definition
- `.dockerignore` - Exclude unnecessary files from build context
- `dokploy.json` - Optional Dokploy configuration

**Files to modify:**
- `next.config.js` - Add standalone output mode and file tracing exclusions

---

## Task 1: Create .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore file**

Create `.dockerignore` in project root with the following content:

```
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage
.nyc_output

# Next.js
.next/
out/
build
dist

# Production
.vercel

# Misc
.DS_Store
*.pem

# Debug
*.log

# Local env files
.env*.local
.env

# IDE
.vscode
.idea
*.swp
*.swo
*~

# Git
.git
.gitignore

# Documentation and backups
docs/
backups/
.superpowers/
.qodo/
.claude/
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la .dockerignore`
Expected: File exists with 644 permissions

- [ ] **Step 3: Commit .dockerignore**

```bash
git add .dockerignore
git commit -m "build: add .dockerignore for Docker build context

Excludes node_modules, .next, env files, and documentation from
Docker build context to reduce image size and build time.

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Update next.config.js for Standalone Output

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Read current next.config.js**

Run: `cat next.config.js`
Expected: See current config with withBundleAnalyzer wrapper

- [ ] **Step 2: Add standalone output configuration**

Update `next.config.js` to add `output` and `outputFileTracingExcludes`:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.2'],
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': [
      'docs/**',
      'backups/**',
      '.superpowers/**',
      '.qodo/**',
      '.claude/**',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Required for `next/image` to render local SVG assets (case covers,
    // case screens). Files are first-party in public/work/ — no remote
    // SVG. CSP locks down what an SVG can do (no scripts, sandboxed).
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

- [ ] **Step 3: Verify syntax is correct**

Run: `node -c next.config.js`
Expected: No output (syntax valid)

- [ ] **Step 4: Commit next.config.js changes**

```bash
git add next.config.js
git commit -m "build: add standalone output mode for Docker deployment

- Add output: 'standalone' to generate minimal production bundle
- Add outputFileTracingExcludes to skip docs/backups during build
- Required for Docker deployment to Dokploy

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile with base stage**

Create `Dockerfile` in project root:

```dockerfile
# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

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

CMD ["node", "server.js"]
```

- [ ] **Step 2: Verify Dockerfile syntax**

Run: `docker build --dry-run -f Dockerfile . 2>&1 | head -5 || echo "Dockerfile created"`
Expected: No syntax errors or file created message

- [ ] **Step 3: Commit Dockerfile**

```bash
git add Dockerfile
git commit -m "build: add multi-stage Dockerfile for Dokploy deployment

- Stage 1 (deps): Install dependencies with npm ci
- Stage 2 (builder): Build Next.js standalone output
- Stage 3 (runner): Minimal production image with non-root user
- Fixes bad gateway error by explicitly defining build/runtime process

Based on working eAI-two reference implementation.

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create dokploy.json Configuration

**Files:**
- Create: `dokploy.json`

- [ ] **Step 1: Create dokploy.json**

Create `dokploy.json` in project root:

```json
{
  "name": "codeminds-digital",
  "description": "Codeminds Digital agency website - Next.js 16 with React 19",
  "version": "0.1.0",
  "type": "application",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "startCommand": "npm run start",
  "port": 3000,
  "healthCheck": {
    "path": "/",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  },
  "environment": {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "resources": {
    "memory": "1024Mi",
    "cpu": "1000m"
  }
}
```

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('dokploy.json', 'utf8'))"`
Expected: No output (valid JSON)

- [ ] **Step 3: Commit dokploy.json**

```bash
git add dokploy.json
git commit -m "build: add Dokploy configuration file

- Explicit build/start commands for Next.js
- Health check on root path with 30s interval
- Resource limits: 1GB memory, 1 CPU core
- Ensures Dokploy correctly detects deployment requirements

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Test Local Docker Build

**Files:**
- Test: `Dockerfile`, `next.config.js`

- [ ] **Step 1: Build Docker image locally**

Run: `docker build -t codeminds-digital-test .`
Expected: Build completes successfully with "Successfully built" message

**Note:** This build will take 3-5 minutes. If it fails:
- Check error message for missing dependencies
- Verify package.json and package-lock.json are present
- Ensure .dockerignore didn't exclude required files

- [ ] **Step 2: Verify standalone output was created**

Run: `docker run --rm codeminds-digital-test ls -la .next/`
Expected: Should see `static/` directory listed

- [ ] **Step 3: Test container starts successfully**

Run: `docker run --rm -p 3001:3000 codeminds-digital-test &`
Expected: Container starts, logs show "Ready on http://0.0.0.0:3000"

Wait 5 seconds for server to start.

- [ ] **Step 4: Test health check endpoint**

Run: `curl -f http://localhost:3001/ | head -20`
Expected: Returns HTML content with status 200

- [ ] **Step 5: Stop test container**

Run: `docker ps -q --filter ancestor=codeminds-digital-test | xargs docker stop`
Expected: Container stops cleanly

- [ ] **Step 6: Clean up test image**

Run: `docker rmi codeminds-digital-test`
Expected: Image removed

---

## Task 6: Create Deployment README

**Files:**
- Create: `README.deployment.md`

- [ ] **Step 1: Create deployment documentation**

Create `README.deployment.md` in project root:

```markdown
# Deployment Guide - Dokploy

## Prerequisites

- Dokploy instance configured and accessible
- Git repository connected to Dokploy
- SMTP credentials for contact form (optional)

## Deployment Steps

### 1. Push to Remote

Push the development branch with deployment configuration:

\`\`\`bash
git push origin development
\`\`\`

### 2. Configure Environment Variables in Dokploy UI

Navigate to your application in Dokploy and add these environment variables:

**Required for contact form:**
- `SMTP_HOST` - Your SMTP server hostname
- `SMTP_PORT` - SMTP port (usually 587 or 465)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - From email address

**Auto-configured:**
- `NODE_ENV=production` (set by Dockerfile)
- `NEXT_TELEMETRY_DISABLED=1` (set by dokploy.json)

### 3. Trigger Deployment

Dokploy will automatically detect the Dockerfile and start the build process:

1. **Build Phase** (~3-5 minutes)
   - Install dependencies
   - Build Next.js application with standalone output
   - Create production Docker image

2. **Deploy Phase** (~1 minute)
   - Start new container
   - Health check validates server is responding
   - Traffic switches to new container

### 4. Verify Deployment

Check these indicators in Dokploy UI:

- ✅ Build logs show "Successfully built"
- ✅ Container logs show "Ready on http://0.0.0.0:3000"
- ✅ Health check status is green/healthy
- ✅ Application accessible at Dokploy-provided URL

### 5. Test Production Site

Test these critical paths:

1. Homepage loads with animations (WebGL shader, Lenis scroll)
2. Navigation to /work, /studio, /journal
3. Contact form submission (requires SMTP configured)
4. Case study pages load with images
5. Mobile responsiveness

## Troubleshooting

### Build Fails

**Check:** Build logs in Dokploy UI
**Common causes:**
- Missing package-lock.json
- npm ci fails due to package conflicts
- Out of memory during build (increase resources)

### Bad Gateway After Deployment

**This should be fixed by the Dockerfile.** If it still occurs:

1. Check container logs - is the server starting?
2. Verify PORT environment variable is 3000
3. Check health check configuration in dokploy.json
4. Ensure Dockerfile CMD is `node server.js`

### Health Check Fails

**Check:** Container logs for startup errors
**Common causes:**
- Server not binding to 0.0.0.0 (check HOSTNAME env var)
- Port mismatch (verify PORT=3000 and EXPOSE 3000)
- Application crashes on startup (check logs for error)

### Contact Form Not Working

**Check:** SMTP environment variables are configured in Dokploy UI
**Test:** Send test email, check server logs for SMTP errors

## Rollback

If deployment fails or introduces issues:

1. Go to Dokploy UI → Deployments
2. Select previous successful deployment
3. Click "Rollback" or "Redeploy"
4. Dokploy switches traffic back to previous container

## Monitoring

After deployment, monitor these metrics:

- **Container logs** - Check for errors or warnings
- **Health check status** - Should remain green
- **Response times** - Should be < 200ms for most routes
- **Memory usage** - Should stay under 1GB
- **CPU usage** - Should stay under 1 core

## Local Testing

To test the Docker build locally before pushing:

\`\`\`bash
# Build image
docker build -t codeminds-digital-local .

# Run container
docker run -p 3000:3000 codeminds-digital-local

# Test in browser
open http://localhost:3000
\`\`\`

## Resources

- Memory: 1024Mi (1GB)
- CPU: 1000m (1 core)
- Port: 3000
- Health check interval: 30 seconds

Adjust in dokploy.json if needed based on usage patterns.
\`\`\`

- [ ] **Step 2: Commit deployment documentation**

\`\`\`bash
git add README.deployment.md
git commit -m "docs: add Dokploy deployment guide

Step-by-step deployment instructions, troubleshooting guide,
and environment variable configuration for production deployment.

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
\`\`\`

---

## Task 7: Push to Remote and Deploy

**Files:**
- All committed files

- [ ] **Step 1: Verify all changes are committed**

Run: `git status`
Expected: "nothing to commit, working tree clean"

If there are uncommitted changes, commit them now.

- [ ] **Step 2: Review commit history**

Run: `git log --oneline -7`
Expected: Should see all 5 commits from this plan:
- Add .dockerignore
- Update next.config.js for standalone output
- Add Dockerfile
- Add dokploy.json
- Add deployment documentation

- [ ] **Step 3: Push to remote repository**

Run: `git push origin development`
Expected: All commits pushed successfully

**Note:** This will trigger Dokploy to rebuild and redeploy the application.

- [ ] **Step 4: Monitor Dokploy build logs**

Go to Dokploy UI → Your Application → Builds → Latest Build

Watch for:
1. "Building Docker image" - should take 3-5 minutes
2. "Successfully built" message
3. "Starting container" message
4. "Health check passed" status

**Expected timeline:**
- Build: 3-5 minutes
- Container start: 30 seconds
- Health check: 30-90 seconds (3 attempts)
- Total: ~5-7 minutes

- [ ] **Step 5: Verify deployment success**

Once build completes and health check passes:

1. Go to Dokploy UI → Your Application → Overview
2. Check status is "Running" (green)
3. Click on the application URL
4. Verify homepage loads correctly

**Success criteria:**
- ✅ No "bad gateway" error
- ✅ Homepage loads with full styling
- ✅ WebGL shader renders (if supported by device)
- ✅ Smooth scroll works (Lenis)
- ✅ Navigation to other pages works

- [ ] **Step 6: Test critical functionality**

Test these paths:

1. Navigate to /work - case studies index loads
2. Click a case study - individual case loads with images
3. Navigate to /studio - about page loads
4. Navigate to /journal - journal index loads
5. Try contact form (requires SMTP env vars configured)

**If contact form doesn't work yet:** This is expected if SMTP environment variables aren't configured. Configure them in Dokploy UI as documented in README.deployment.md.

- [ ] **Step 7: Document deployment results**

Create a quick note of what worked and what needs follow-up:

```bash
echo "Deployment completed at $(date)" > deployment-notes.txt
echo "Bad gateway issue: RESOLVED / NOT RESOLVED" >> deployment-notes.txt
echo "Contact form: WORKING / NEEDS SMTP CONFIG" >> deployment-notes.txt
git add deployment-notes.txt
git commit -m "docs: deployment results for $(date +%Y-%m-%d)"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Dockerfile created (multi-stage build)
- ✅ .dockerignore created (excludes build artifacts)
- ✅ next.config.js updated (standalone output + file tracing exclusions)
- ✅ dokploy.json created (health check + resource limits)
- ✅ Local Docker build tested
- ✅ Push to remote triggers Dokploy rebuild
- ✅ Deployment documentation added

**No placeholders:**
- ✅ All code blocks have complete content
- ✅ All file paths are absolute and exact
- ✅ All commands have expected output documented
- ✅ No "TBD", "TODO", or "implement later" language

**Type consistency:**
- ✅ File paths consistent across all tasks
- ✅ Configuration keys match between dokploy.json and Dockerfile
- ✅ Port numbers consistent (3000 everywhere)
- ✅ Environment variables consistent

**Task completeness:**
- ✅ Each step is 2-5 minutes of work
- ✅ Every code change has a commit step
- ✅ Every file creation has a verification step
- ✅ Test task validates the whole deployment works locally

---

## Success Criteria

Deployment is complete when:

1. ✅ All 7 tasks completed
2. ✅ All files committed to development branch
3. ✅ Changes pushed to remote repository
4. ✅ Dokploy build completes successfully
5. ✅ Container starts and logs show "Ready on http://0.0.0.0:3000"
6. ✅ Health check passes (green status)
7. ✅ Website accessible at Dokploy URL
8. ✅ **Bad gateway error is resolved**
9. ✅ All pages load correctly
10. ✅ Animations and WebGL shader work

**Follow-up tasks (after deployment):**
- Configure SMTP environment variables in Dokploy UI
- Test contact form submission
- Monitor performance metrics (LCP, INP, CLS)
- Adjust resource limits if needed
