# Deployment Guide - Codeminds Digital

This guide provides step-by-step instructions for deploying the Codeminds Digital website to production using Dokploy on a VPS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Steps](#deployment-steps)
3. [Environment Variables](#environment-variables)
4. [Troubleshooting](#troubleshooting)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring](#monitoring)
7. [Local Testing](#local-testing)
8. [Resources](#resources)

---

## Prerequisites

Before deploying, ensure you have:

### Infrastructure
- **VPS or Server**: Ubuntu 20.04+ or similar Linux distribution with at least 2GB RAM (recommended 4GB+)
- **Docker**: Version 20.10+ installed on the server
- **Dokploy**: Latest version installed and configured

### Credentials & Access
- **Git Repository Access**: SSH key configured for accessing the Git repository
- **Remote Git URL**: SSH-based remote URL (e.g., `git@github.com:org/repo.git`)
- **Domain Name**: Configured and pointing to your server IP
- **SSL Certificate**: Pre-configured or ready for setup (Dokploy can handle Let's Encrypt)

### Local Development
- **Node.js**: Version 20+ (for local builds/testing)
- **npm**: Version 10+ (included with Node.js)
- **Next.js**: Version 16.2.4+ (included in dependencies)

### Configuration Files
Verify these files exist in the project root:
- ✅ `Dockerfile` - Multi-stage build configuration
- ✅ `dokploy.json` - Deployment metadata and health checks
- ✅ `.dockerignore` - Docker build optimization
- ✅ `next.config.js` - Next.js standalone output enabled
- ✅ `.env.example` - Environment variable template

---

## Deployment Steps

### Step 1: Push to Remote Repository

Ensure all changes are committed and pushed to the remote repository:

```bash
# From your local machine
cd /path/to/codeminds-digital

# Check git status
git status

# If there are uncommitted changes:
git add .
git commit -m "Your commit message"

# Push to the remote repository (main branch or deployment branch)
git push origin main
```

**Important**: Dokploy will pull from the remote repository, so all changes must be pushed before deployment.

### Step 2: Configure Environment Variables

On the deployment server, create the `.env.local` file with production values:

```bash
# SSH into your VPS
ssh user@your-server-ip

# Navigate to the application directory (created by Dokploy or manual setup)
cd /path/to/codeminds-digital

# Create .env.local with production values
nano .env.local
```

**Paste the following template and fill in your actual values:**

```
# Email Configuration for Contact Form
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Production URL (for SEO and social sharing)
NEXT_PUBLIC_SITE_URL=https://codeminds.digital

# Optional: Alternative SMTP Configuration
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_USER=your-email@domain.com
# SMTP_PASS=your-password
```

**Environment Variables Explained:**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_USER` | Yes | Gmail address for sending contact form emails | `contact@codeminds.digital` |
| `EMAIL_PASS` | Yes | Gmail App Password (not your regular password) | `abcd efgh ijkl mnop` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production domain URL | `https://codeminds.digital` |
| `SMTP_HOST` | No | Custom SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | No | Custom SMTP server port | `587` |
| `SMTP_USER` | No | Custom SMTP username | `your-email@domain.com` |
| `SMTP_PASS` | No | Custom SMTP password | `your-password` |

**Note**: Never commit `.env.local` to version control. The file is automatically added to `.gitignore`.

### Step 3: Trigger Deployment with Dokploy

Via Dokploy Web Interface:

1. Log into Dokploy dashboard at `https://your-server-ip:3001` (or configured port)
2. Navigate to **Applications** → **codeminds-digital**
3. Click **Deploy** or **Redeploy**
4. Wait for the build and deployment to complete
5. Monitor logs in the dashboard

Via Dokploy CLI (if available):

```bash
# SSH into your VPS
ssh user@your-server-ip

# Trigger deployment
dokploy deploy codeminds-digital

# Watch logs in real-time
dokploy logs codeminds-digital -f
```

### Step 4: Verify Deployment

Check the application status:

```bash
# SSH into your VPS
ssh user@your-server-ip

# Check Docker container status
docker ps | grep codeminds

# Check container logs
docker logs <container-id> -f

# Check health endpoint (from the server)
curl http://localhost:3000/

# From your local machine, test the production URL
curl https://codeminds.digital
```

**Success Indicators:**
- ✅ Docker container is running (`docker ps` shows the container)
- ✅ Container logs show no errors
- ✅ Health check endpoint returns HTTP 200
- ✅ Website loads and displays correctly at production URL
- ✅ Contact form is accessible and functional

### Step 5: Test Production Site

Test all major functionality:

1. **Page Load**: Visit https://codeminds.digital and verify homepage loads
2. **Navigation**: Test all main navigation links (About, Services, Contact, etc.)
3. **Contact Form**: 
   - Fill out contact form with test data
   - Verify submission succeeds
   - Check email inbox for confirmation email
   - Verify response time is reasonable (< 5 seconds)
4. **Responsive Design**: Test on mobile (use browser DevTools or real device)
5. **Performance**: Check page load times and Google PageSpeed (target: > 70)
6. **SSL Certificate**: Verify HTTPS is active and certificate is valid

---

## Environment Variables

### Production Environment Variables

The application requires these variables in production:

#### Email Configuration

**Option 1: Gmail SMTP (Recommended for Getting Started)**

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # NOT your Gmail password!
```

To generate Gmail App Password:
1. Enable 2-Step Verification on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (custom name)" → type "codeminds-digital"
4. Generate the password (16 characters)
5. Use the generated password in `EMAIL_PASS`

**Option 2: Custom SMTP Server**

```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

#### Public Configuration

```bash
NEXT_PUBLIC_SITE_URL=https://codeminds.digital
NEXT_TELEMETRY_DISABLED=1  # Automatically set by dokploy.json
NODE_ENV=production          # Automatically set by dokploy.json
```

### How Next.js Handles Environment Variables

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are only available server-side
- Environment variables are baked into the build for Next.js
- Changes to environment variables require a rebuild/redeploy

---

## Troubleshooting

### Build Fails During Deployment

**Symptoms:**
- Deployment process stops during build
- Logs show: "npm ERR!" or "Failed to build application"
- Container fails to start

**Solutions:**

1. **Check Dependencies**:
   ```bash
   # SSH into server
   ssh user@your-server-ip
   
   # Verify package-lock.json exists and is correct
   git log -1 --format="%H" package-lock.json
   
   # Try rebuilding locally first
   npm ci
   npm run build
   ```

2. **Clear Docker Cache**:
   ```bash
   # SSH into server
   ssh user@your-server-ip
   
   # Stop container
   docker stop <container-id>
   
   # Remove container and images
   docker rm <container-id>
   docker image prune -a
   
   # Redeploy from Dokploy dashboard
   ```

3. **Check Node Version**:
   ```bash
   # Verify Node.js version in Dockerfile
   cat Dockerfile | grep "FROM node"
   
   # Should be: FROM node:20-alpine
   ```

4. **Review Build Logs**:
   ```bash
   # Get full build logs
   docker logs <container-id> --tail 100
   
   # Look for specific errors (dependency issues, TypeScript errors, etc.)
   ```

### Bad Gateway (502) Error

**Symptoms:**
- Website returns "502 Bad Gateway" or "502 Bad Gateway (Nginx)"
- Container is running but requests fail

**Solutions:**

1. **Verify Container is Running**:
   ```bash
   docker ps | grep codeminds
   # Should show container running for a few seconds or more
   ```

2. **Check Port Binding**:
   ```bash
   # Verify port 3000 is accessible
   curl http://localhost:3000
   
   # If fails, check Docker network
   docker network inspect bridge | grep codeminds
   ```

3. **Review Container Logs**:
   ```bash
   docker logs <container-id> -f
   
   # Look for: "ready - started server on" (successful start)
   # or error messages like "Cannot find module"
   ```

4. **Restart Container**:
   ```bash
   # Restart via Dokploy or manually
   docker restart <container-id>
   
   # Wait 10-15 seconds for container to be ready
   sleep 15 && curl http://localhost:3000
   ```

5. **Check Nginx/Reverse Proxy Configuration**:
   ```bash
   # If using Nginx (typical Dokploy setup)
   nginx -t  # Test config syntax
   sudo systemctl restart nginx
   ```

### Health Check Fails

**Symptoms:**
- Deployment shows "Health check failed"
- Container restarts repeatedly
- Application never becomes "ready"

**Solutions:**

1. **Verify Health Check Configuration**:
   ```bash
   # Check dokploy.json settings
   cat dokploy.json | grep -A 5 "healthCheck"
   
   # Expected output:
   # "healthCheck": {
   #   "path": "/",
   #   "interval": 30,
   #   "timeout": 10,
   #   "retries": 3
   # }
   ```

2. **Test Health Endpoint Manually**:
   ```bash
   # Wait 15 seconds after deployment, then test
   sleep 15
   curl -v http://localhost:3000/
   
   # Should return HTTP 200 and HTML content
   ```

3. **Check Container Resource Limits**:
   ```bash
   # Verify memory/CPU aren't exhausted
   docker stats <container-id>
   
   # If memory usage is very high, rebuild or increase resources
   ```

4. **Review Application Startup Logs**:
   ```bash
   docker logs <container-id> -f --since 1m
   
   # Look for messages like:
   # ✓ Ready in 3.2s
   # ready - started server on 0.0.0.0:3000
   ```

5. **Increase Health Check Timeout**:
   ```bash
   # If container needs more time to start, edit dokploy.json
   nano dokploy.json
   
   # Increase timeout and retries:
   # "timeout": 15,
   # "retries": 5
   
   # Then redeploy
   ```

### Contact Form Fails to Send Email

**Symptoms:**
- Contact form submission shows error
- Email is not received
- Logs show: "Invalid login" or "SMTP error"

**Solutions:**

1. **Verify Environment Variables are Set**:
   ```bash
   ssh user@your-server-ip
   
   # Check .env.local exists
   cat .env.local
   
   # Verify EMAIL_USER and EMAIL_PASS are set
   echo $EMAIL_USER  # May be empty if not in shell environment
   ```

2. **Test Email Credentials Locally**:
   ```bash
   # Create a test script on server
   cat > test-email.js << 'EOF'
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS
     }
   });
   
   transporter.verify((error, success) => {
     if (error) {
       console.log('Email configuration error:', error);
     } else {
       console.log('Email configuration is valid');
     }
   });
   EOF
   
   # Run test
   node test-email.js
   ```

3. **Check Gmail App Password**:
   - Verify 2-Step Verification is enabled on Google Account
   - Regenerate App Password at https://myaccount.google.com/apppasswords
   - Ensure no typos in EMAIL_PASS (typically 16 characters with spaces)

4. **Review Application Logs**:
   ```bash
   docker logs <container-id> -f
   
   # Look for nodemailer error messages
   # Should show: "Email sent successfully" on successful send
   ```

5. **Check Firewall Rules**:
   ```bash
   # Verify outbound SMTP port 587 is open
   telnet smtp.gmail.com 587
   
   # If connection fails, check firewall rules on VPS
   sudo ufw status
   ```

6. **Test Email with Curl** (if API endpoint exists):
   ```bash
   curl -X POST https://codeminds.digital/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "message": "Test message"
     }'
   ```

---

## Rollback Procedures

### Quick Rollback (Last Deployment)

**If the current deployment is broken:**

1. **Via Dokploy Dashboard**:
   - Go to Applications → codeminds-digital → Deployments
   - Select the previous successful deployment
   - Click "Rollback" or "Redeploy"

2. **Via Docker (Manual)**:
   ```bash
   ssh user@your-server-ip
   
   # Find the previous image
   docker images | grep codeminds
   
   # Stop current container
   docker stop <current-container-id>
   
   # Run with previous image
   docker run -d --name codeminds-old \
     -p 3000:3000 \
     -e NODE_ENV=production \
     --env-file /path/to/.env.local \
     <previous-image-id>
   ```

3. **Via Git**:
   ```bash
   ssh user@your-server-ip
   cd /path/to/codeminds-digital
   
   # Find the last good commit
   git log --oneline | head -10
   
   # Checkout previous commit
   git checkout <previous-commit-hash>
   
   # Trigger redeploy from Dokploy
   ```

### Complete Rollback Checklist

- [ ] Verify previous deployment version number
- [ ] Test the rollback in a staging environment first (if available)
- [ ] Notify team of the rollback
- [ ] Monitor application for 30 minutes after rollback
- [ ] Document the reason for rollback
- [ ] Plan fix for the broken deployment

### Preventing Rollbacks

1. **Test in Staging**: Always test deployments in a staging environment first
2. **Automated Tests**: Implement automated tests in CI/CD pipeline
3. **Blue-Green Deployment**: Deploy to a separate instance and switch traffic
4. **Feature Flags**: Use feature flags for gradual rollout of new features

---

## Monitoring

### Key Metrics to Monitor

#### Application Health

```bash
# Check if application is responding
curl -I https://codeminds.digital

# Should return HTTP 200
```

#### Docker Container

```bash
# Monitor container health
docker stats <container-id>

# Check CPU, memory, network usage
# Alert if: Memory > 80% of limit, CPU constantly > 80%
```

#### Server Health

```bash
# Check disk space
df -h

# Alert if: Root partition > 80% full

# Check system load
uptime

# Alert if: Load average > 4 (on 2-core system) for > 5 minutes
```

### Logging Strategy

**Application Logs:**
- Docker container logs: `docker logs <container-id>`
- Store logs to file or external service (ELK, CloudWatch, etc.)

**Error Monitoring:**
- Monitor for: 502 Bad Gateway, 500 Internal Server Error, timeout
- Alert on: Multiple 5xx errors in 5 minutes

**Performance Monitoring:**
- Response time: Target < 1 second for page loads
- Page size: Target < 5MB (including images)
- Google PageSpeed: Target > 70 score

### Setting Up Alerts

**Email Alerts:**
```bash
# Monitor container status every 5 minutes
*/5 * * * * docker ps | grep codeminds || (echo "Container down" | mail -s "Alert: codeminds down" admin@domain.com)
```

**Webhook Alerts:**
- Configure Dokploy to send deployment status to Slack or Discord
- Set up alerts for failed deployments and health check failures

---

## Local Testing

### Build Docker Image Locally

```bash
# Navigate to project directory
cd /path/to/codeminds-digital

# Build the Docker image
docker build -t codeminds-digital:latest .

# Verify build succeeded
docker images | grep codeminds-digital
```

### Run Container Locally

```bash
# Create .env.local with test values
cat > .env.local << 'EOF'
EMAIL_USER=test@gmail.com
EMAIL_PASS=your-test-app-password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

# Run the container
docker run -d \
  --name codeminds-test \
  -p 3000:3000 \
  --env-file .env.local \
  codeminds-digital:latest

# Check if container is running
docker ps | grep codeminds-test

# View logs
docker logs codeminds-test -f

# Test the application
curl http://localhost:3000

# Test contact form endpoint (if available)
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message"
  }'

# Stop the container
docker stop codeminds-test
docker rm codeminds-test
```

### Test Environment Variables

```bash
# Verify environment variables are available in production

# Check Node.js environment
docker exec <container-id> node -e "console.log('EMAIL_USER:', process.env.EMAIL_USER)"

# Should output the EMAIL_USER value
```

### Performance Testing

```bash
# Load test the application (install ab first: `brew install httpd`)
ab -n 100 -c 10 http://localhost:3000/

# Test with different concurrency levels
ab -n 1000 -c 50 http://localhost:3000/

# Analyze results:
# - Requests per second: Higher is better (target: > 50)
# - Failed requests: Should be 0
# - Mean time per request: Target < 100ms
```

---

## Resources

### Documentation

- **Next.js Production Deployment**: https://nextjs.org/docs/deployment/production-checklist
- **Docker Documentation**: https://docs.docker.com/
- **Dokploy Documentation**: https://dokploy.io/
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/nodejs-performance/

### Project Configuration Files

- **Dockerfile**: Multi-stage build configuration
- **dokploy.json**: Deployment metadata and health checks
- **.dockerignore**: Docker build optimization
- **next.config.js**: Next.js configuration (standalone output enabled)
- **.env.example**: Environment variable template

### Important Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container build configuration |
| `dokploy.json` | Deployment settings and health checks |
| `.dockerignore` | Excludes unnecessary files from Docker build |
| `next.config.js` | Next.js compilation and optimization settings |
| `.env.local` | Production environment variables (not in version control) |
| `package.json` | Project dependencies and build scripts |

### Quick Commands Reference

```bash
# Build and Deploy
git push origin main
# Then trigger deployment from Dokploy

# Monitor Deployment
docker logs <container-id> -f
docker stats <container-id>

# Check Status
curl https://codeminds.digital
curl -I https://codeminds.digital  # Headers only

# Restart Application
docker restart <container-id>

# View Container Details
docker ps
docker inspect <container-id>

# Clean Up Old Images
docker image prune -a

# SSH Into Server
ssh user@your-server-ip
```

### Troubleshooting Quick Links

- **502 Bad Gateway**: Check container logs and nginx configuration
- **Build Fails**: Verify Node.js version and dependencies
- **Health Check Fails**: Check port binding and container resource limits
- **Email Not Sending**: Verify Gmail App Password and SMTP credentials
- **No Changes After Deploy**: Ensure changes are pushed to remote repository

---

## Support & Escalation

If you encounter issues not covered in this guide:

1. **Check Deployment Logs**: Review both build and runtime logs for specific error messages
2. **Verify Configuration**: Ensure all environment variables and config files are correct
3. **Test Locally**: Reproduce the issue locally using Docker before troubleshooting on server
4. **Review Recent Changes**: Check recent commits for breaking changes
5. **Contact DevOps Team**: Reach out with logs and specific error messages

---

**Last Updated**: May 7, 2026  
**Project**: Codeminds Digital  
**Version**: 0.1.0
