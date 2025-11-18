# Production Deployment Checklist

This comprehensive checklist ensures a smooth and secure deployment to production.

## Table of Contents
- [Pre-Deployment](#pre-deployment)
- [Configuration](#configuration)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Post-Deployment](#post-deployment)
- [Rollback Plan](#rollback-plan)

---

## Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors (if using TS)
- [ ] Code review completed and approved
- [ ] All TODOs resolved or documented
- [ ] No debug/console.log statements in production code
- [ ] No commented-out code blocks

### Documentation
- [ ] README.md is up-to-date
- [ ] CHANGELOG.md updated with new version
- [ ] API documentation updated (if APIs changed)
- [ ] Environment variables documented in .env.example
- [ ] Breaking changes documented
- [ ] Migration guide created (if needed)

### Version Control
- [ ] All changes committed to Git
- [ ] Feature branch merged to develop
- [ ] Develop merged to main (after testing)
- [ ] Git tags created for version
- [ ] No uncommitted changes
- [ ] Clean git status

### Dependencies
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] All dependencies up-to-date (or documented why not)
- [ ] Lock file (`package-lock.json`) committed
- [ ] No unused dependencies
- [ ] Production dependencies separated from dev dependencies

---

## Configuration

### Environment Variables

#### Required Variables
- [ ] `VITE_FIREBASE_API_KEY` - Firebase API key
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- [ ] `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - Storage bucket
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - Messaging sender ID
- [ ] `VITE_FIREBASE_APP_ID` - Firebase app ID
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (live mode)
- [ ] `VITE_ENVIRONMENT=production`

#### Optional Variables
- [ ] `VITE_SENTRY_DSN` - Sentry DSN for error tracking
- [ ] `VITE_RELEASE_VERSION` - Current release version
- [ ] `VITE_ANALYTICS_ENDPOINT` - Custom analytics endpoint
- [ ] `VITE_API_URL_PRODUCTION` - Production API URL

#### Verification Script
```bash
#!/bin/bash
# scripts/verify-env.sh

required_vars=(
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_AUTH_DOMAIN"
  "VITE_FIREBASE_PROJECT_ID"
  "VITE_STRIPE_PUBLISHABLE_KEY"
)

missing=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '   - %s\n' "${missing[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"
```

### Firebase Configuration

#### Firestore
- [ ] Security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Indexes created (`firebase deploy --only firestore:indexes`)
- [ ] Database backup enabled
- [ ] PITR (Point-in-Time Recovery) enabled

#### Storage
- [ ] Security rules deployed (`firebase deploy --only storage:rules`)
- [ ] CORS configuration set
- [ ] Backup strategy configured

#### Hosting
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Redirects configured (www to non-www, or vice versa)
- [ ] Security headers configured in `firebase.json`

#### Authentication
- [ ] Email/password provider enabled
- [ ] Google OAuth configured (if used)
- [ ] Email templates customized
- [ ] Authorized domains added

### Stripe Configuration

- [ ] Live mode API keys configured
- [ ] Webhook endpoints configured
- [ ] Webhook secret stored securely
- [ ] Products and prices created in live mode
- [ ] Payment methods enabled
- [ ] Tax calculation configured (if applicable)
- [ ] Customer portal configured

---

## Security

### Security Checklist

#### Application Security
- [ ] CSP headers configured
- [ ] Security headers configured (X-Frame-Options, etc.)
- [ ] Input validation on all forms
- [ ] XSS protection implemented
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] SQL injection protection (not applicable for Firestore)
- [ ] Authentication required for protected routes
- [ ] Session timeout configured

#### Firebase Security
- [ ] Firestore rules tested in emulator
- [ ] Storage rules tested in emulator
- [ ] No overly permissive rules (no `allow read, write: if true`)
- [ ] Admin SDK credentials secured
- [ ] Service account permissions minimal
- [ ] Firebase App Check enabled (recommended)

#### Secrets Management
- [ ] No secrets in code
- [ ] No secrets in Git history
- [ ] Environment variables properly set
- [ ] API keys restricted by domain/IP
- [ ] Stripe webhook secret stored securely
- [ ] Firebase config properly restricted

#### SSL/TLS
- [ ] HTTPS enforced
- [ ] Valid SSL certificate
- [ ] Certificate auto-renewal configured
- [ ] HSTS header enabled
- [ ] Mixed content warnings resolved

### Security Scan

```bash
# Run security audit
npm audit

# Check for known vulnerabilities
npm audit fix

# Snyk scan (optional)
npx snyk test

# OWASP dependency check (optional)
npx owasp-dependency-check --scan ./
```

---

## Testing

### Automated Tests
- [ ] Unit tests passing (target: 80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance tests within budget
- [ ] Security tests passing
- [ ] No flaky tests

### Manual Testing

#### Core Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Email verification works
- [ ] User profile update works
- [ ] Property CRUD operations work
- [ ] Income statement creation/editing works
- [ ] Baseline creation/management works
- [ ] File upload works
- [ ] Data persistence verified

#### Payment Flow
- [ ] Pricing page displays correctly
- [ ] Stripe checkout works
- [ ] Payment succeeds
- [ ] Subscription activates
- [ ] Webhook updates database
- [ ] Customer portal works
- [ ] Subscription cancellation works
- [ ] Invoice generation works

#### Access Control
- [ ] Free tier restrictions enforced
- [ ] Basic tier features accessible
- [ ] Pro tier features accessible
- [ ] Unauthorized access blocked
- [ ] Protected routes require authentication
- [ ] Tier-based features work correctly

#### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Android Chrome)

#### Performance Testing
- [ ] Page load time < 3s
- [ ] Time to Interactive < 3.5s
- [ ] Lighthouse score > 90
- [ ] No memory leaks
- [ ] No excessive re-renders

### Load Testing

```bash
# Using Artillery or k6
npm install -g artillery

# Run load test
artillery run load-test.yml

# Example load-test.yml:
# config:
#   target: 'https://yourapp.com'
#   phases:
#     - duration: 60
#       arrivalRate: 10
# scenarios:
#   - flow:
#       - get:
#           url: "/"
#       - get:
#           url: "/login"
```

---

## Deployment

### Pre-Deployment Steps

- [ ] Create deployment branch from main
- [ ] Tag release in Git (`git tag v1.0.0`)
- [ ] Create GitHub release with changelog
- [ ] Notify team of deployment
- [ ] Schedule maintenance window (if needed)
- [ ] Backup current production data

### Deployment Process

#### 1. Build Production Bundle

```bash
cd frontend
npm install --production=false
npm run build
```

**Verification:**
- [ ] Build completes without errors
- [ ] Bundle size acceptable (< 500 KB gzipped)
- [ ] Source maps generated
- [ ] Assets optimized

#### 2. Deploy to Staging (Optional but Recommended)

```bash
# Deploy to staging environment
firebase use staging
firebase deploy

# Test staging deployment
# Run smoke tests
npm run test:e2e:staging
```

**Staging Verification:**
- [ ] Staging deployment successful
- [ ] Smoke tests pass
- [ ] Manual testing on staging
- [ ] Performance acceptable

#### 3. Deploy to Production

```bash
# Switch to production project
firebase use production

# Deploy all
firebase deploy

# Or deploy selectively:
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

**Deployment Log:**
- Deployment started at: ________________
- Deployed by: ________________
- Git commit: ________________
- Version: ________________
- Deployment completed at: ________________

### Deployment Verification

#### Immediate Checks (0-5 minutes)
- [ ] Deployment successful
- [ ] Website accessible
- [ ] Homepage loads
- [ ] Login page works
- [ ] No console errors
- [ ] Assets loading correctly

#### Short-term Checks (5-30 minutes)
- [ ] User registrations working
- [ ] Payments working
- [ ] Database writes successful
- [ ] File uploads working
- [ ] Email notifications sending
- [ ] Analytics tracking
- [ ] Error monitoring active

#### Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🏥 Running health checks..."

# Check homepage
if curl -s -o /dev/null -w "%{http_code}" https://yourapp.com | grep -q "200"; then
  echo "✅ Homepage: OK"
else
  echo "❌ Homepage: FAILED"
  exit 1
fi

# Check API endpoints
for endpoint in "/api/health" "/login" "/pricing"; do
  if curl -s -o /dev/null -w "%{http_code}" https://yourapp.com${endpoint} | grep -q "200"; then
    echo "✅ ${endpoint}: OK"
  else
    echo "❌ ${endpoint}: FAILED"
  fi
done

echo "✅ All health checks passed"
```

---

## Post-Deployment

### Monitoring

#### First Hour
- [ ] Monitor error rate in Sentry
- [ ] Check application logs
- [ ] Monitor performance metrics
- [ ] Watch for user reports
- [ ] Monitor server metrics

#### First Day
- [ ] Review error trends
- [ ] Check performance compared to baseline
- [ ] Monitor new user signups
- [ ] Verify payments processing
- [ ] Review analytics

#### First Week
- [ ] Analyze user feedback
- [ ] Review performance trends
- [ ] Check for regressions
- [ ] Monitor costs (Firebase, Stripe)
- [ ] Review security alerts

### Communication

#### Internal
- [ ] Notify team deployment is complete
- [ ] Share deployment summary
- [ ] Update status page
- [ ] Document any issues

#### External (if applicable)
- [ ] Announce new features
- [ ] Update changelog
- [ ] Email users about major changes
- [ ] Post on social media

### Documentation

- [ ] Update deployment log
- [ ] Document any issues encountered
- [ ] Create post-deployment report
- [ ] Update runbooks if needed
- [ ] Archive deployment artifacts

---

## Rollback Plan

### When to Rollback

Rollback if:
- ❌ Critical errors affecting > 10% of users
- ❌ Payment system not working
- ❌ Data corruption detected
- ❌ Security vulnerability discovered
- ❌ Performance degradation > 50%
- ❌ Service completely unavailable

### Rollback Procedure

#### Quick Rollback (Firebase Hosting)

```bash
# List previous deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback

# Or deploy specific version
firebase deploy --only hosting --message "Rollback to v1.0.0"
```

#### Full Rollback (All Services)

```bash
# 1. Identify previous working commit
git log --oneline

# 2. Checkout previous version
git checkout <previous-commit>

# 3. Rebuild
npm install
npm run build

# 4. Deploy
firebase deploy

# 5. Verify
./scripts/health-check.sh
```

#### Database Rollback (if needed)

```bash
# Restore from backup
gcloud firestore import gs://[BACKUP_BUCKET]/firestore/[BACKUP_DATE]

# Verify restoration
node scripts/verify-restore.js
```

### Post-Rollback

- [ ] Verify application working
- [ ] Notify team of rollback
- [ ] Update status page
- [ ] Investigate root cause
- [ ] Create hotfix plan
- [ ] Schedule new deployment

---

## Deployment Automation

### GitHub Actions Deployment

Already configured in `.github/workflows/deploy-production.yml`

**Triggers:**
- Manual approval required
- Runs on push to main (with approval)

**Steps:**
1. Run all checks (lint, test, build)
2. Security audit
3. Performance audit
4. **Manual approval gate**
5. Deploy to production
6. Run smoke tests
7. Send notifications

### Deployment Commands

```bash
# Trigger production deployment via GitHub Actions
git push origin main

# Or use GitHub CLI
gh workflow run deploy-production.yml

# Check deployment status
gh run list --workflow=deploy-production.yml
```

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails

**Symptoms:** `npm run build` fails

**Solutions:**
- Check Node version: `node --version`
- Clear cache: `rm -rf node_modules && npm install`
- Check for missing environment variables
- Review build logs for errors

#### Deployment Hangs

**Symptoms:** `firebase deploy` hangs

**Solutions:**
- Check internet connection
- Verify Firebase project ID
- Try deploying specific targets: `firebase deploy --only hosting`
- Check Firebase status: https://status.firebase.google.com

#### Site Not Updating

**Symptoms:** Old version still showing

**Solutions:**
- Clear browser cache (Ctrl+Shift+R)
- Check CDN cache (may take 5-10 minutes)
- Verify deployment completed successfully
- Check Firebase Hosting dashboard

#### SSL Certificate Issues

**Symptoms:** HTTPS not working

**Solutions:**
- Wait 24 hours for certificate provisioning
- Verify domain DNS settings
- Check Firebase Hosting configuration
- Contact Firebase support if persists

---

## Checklist Summary

### Critical Items (Must Complete)

- [ ] All tests passing
- [ ] Security audit passed
- [ ] Environment variables configured
- [ ] Firebase rules deployed
- [ ] Stripe configuration verified
- [ ] Build successful
- [ ] Deployment successful
- [ ] Health checks passing
- [ ] Monitoring active

### Nice to Have (Recommended)

- [ ] Staging deployment tested
- [ ] Load testing completed
- [ ] Performance budget met
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan tested
- [ ] Post-deployment report created

---

## Sign-Off

**Deployment Approved By:**

- [ ] Engineering Lead: __________________ Date: __________
- [ ] Product Manager: __________________ Date: __________
- [ ] CTO/Tech Lead: ____________________ Date: __________

**Deployment Completion:**

- Deployed By: __________________
- Date: __________________
- Time: __________________
- Version: __________________
- Git Commit: __________________

**Post-Deployment Status:**

- [ ] All checks passing
- [ ] No critical issues
- [ ] Monitoring shows healthy metrics
- [ ] Ready for production traffic

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Next Review:** Before each deployment
