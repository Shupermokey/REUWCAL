# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for this project.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Required Secrets](#required-secrets)
- [Branch Strategy](#branch-strategy)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)

---

## Overview

Our CI/CD pipeline automates testing, building, and deploying the application across different environments.

### Pipeline Architecture

```
┌─────────────┐
│ Pull Request│
└──────┬──────┘
       │
       ├──> Lint & Code Quality
       ├──> Unit & Integration Tests
       ├──> Build Check
       ├──> E2E Tests
       ├──> Security Scan
       └──> Dependency Check

┌─────────────┐
│ Push to     │
│ develop     │
└──────┬──────┘
       │
       ├──> Build & Test
       ├──> Deploy to Staging
       └──> Smoke Tests

┌─────────────┐
│ Push to main│
│ or tag      │
└──────┬──────┘
       │
       ├──> Build & Test
       ├──> Security Scan
       ├──> Manual Approval ⏸️
       ├──> Deploy to Production
       ├──> Create Sentry Release
       ├──> Smoke Tests
       └──> Notify Team
```

---

## Workflows

### 1. PR Checks (`pr-checks.yml`)

**Trigger**: Pull requests to `main` or `develop`

**Jobs**:
1. **Lint** - ESLint, unused imports check
2. **Test** - Unit & integration tests with coverage
3. **Build** - Build check and size analysis
4. **E2E** - End-to-end tests with Playwright
5. **Security** - npm audit, secret scanning
6. **Dependencies** - Outdated dependency check
7. **Summary** - Comment PR with results

**Artifacts**:
- Build artifacts (7 days)
- Playwright reports (7 days)
- Coverage reports (uploaded to Codecov)

**Time**: ~5-10 minutes

### 2. Staging Deployment (`deploy-staging.yml`)

**Trigger**: Push to `develop` branch or manual dispatch

**Jobs**:
1. **Build** - Build with staging config
2. **Deploy** - Deploy to Firebase Hosting (staging channel)
3. **Smoke Tests** - Run critical tests against staging
4. **Notify** - Send Slack notification

**Environment**: `staging`
**URL**: `https://staging.yourapp.com`

**Time**: ~5-8 minutes

### 3. Production Deployment (`deploy-production.yml`)

**Trigger**: Push to `main` branch, version tags (`v*`), or manual dispatch

**Jobs**:
1. **Validate** - Validate deployment prerequisites
2. **Build** - Build with production config
3. **Security** - Final security scan
4. **Approval** ⏸️ - Wait for manual approval
5. **Deploy** - Deploy to Firebase Hosting (live)
6. **Sentry** - Create Sentry release for error tracking
7. **Smoke Tests** - Run critical tests against production
8. **Rollback** - Auto-trigger if smoke tests fail
9. **Notify** - Send Slack notification & create GitHub release

**Environment**: `production`
**URL**: `https://yourapp.com`

**Time**: ~10-15 minutes (excluding approval wait)

---

## Required Secrets

### GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

#### Firebase (Staging)
```
STAGING_FIREBASE_API_KEY
STAGING_FIREBASE_AUTH_DOMAIN
STAGING_FIREBASE_PROJECT_ID
STAGING_FIREBASE_STORAGE_BUCKET
STAGING_FIREBASE_MESSAGING_SENDER_ID
STAGING_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_STAGING
```

#### Firebase (Production)
```
PROD_FIREBASE_API_KEY
PROD_FIREBASE_AUTH_DOMAIN
PROD_FIREBASE_PROJECT_ID
PROD_FIREBASE_STORAGE_BUCKET
PROD_FIREBASE_MESSAGING_SENDER_ID
PROD_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_PROD
```

#### Stripe (Staging)
```
STAGING_STRIPE_PUBLISHABLE_KEY
STAGING_STRIPE_PRICE_MARKETING
STAGING_STRIPE_PRICE_DEVELOPER
STAGING_STRIPE_PRICE_SYNDICATOR
STAGING_API_URL
```

#### Stripe (Production)
```
PROD_STRIPE_PUBLISHABLE_KEY
PROD_STRIPE_PRICE_MARKETING
PROD_STRIPE_PRICE_DEVELOPER
PROD_STRIPE_PRICE_SYNDICATOR
PROD_API_URL
```

#### Monitoring & Notifications
```
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
SLACK_WEBHOOK_URL
```

#### Optional
```
CODECOV_TOKEN (for coverage reporting)
```

### Environment Protection Rules

Configure in **Settings → Environments**:

#### `production-approval`
- ✅ Required reviewers: Your team members
- ✅ Wait timer: 0 minutes
- ✅ Prevent self-review: Yes

#### `production`
- ✅ Deployment branches: `main` only
- ✅ Environment secrets configured

#### `staging`
- ✅ Deployment branches: `develop` only
- ✅ Environment secrets configured

---

## Branch Strategy

### Branch Types

```
main
  ↑
  │ (production deployment)
  │
develop
  ↑
  │ (staging deployment)
  │
feature/*
  └─> Pull Request → develop
```

### Naming Conventions

- **Feature branches**: `feature/description` or `feat/description`
- **Bug fixes**: `fix/description` or `bugfix/description`
- **Hotfixes**: `hotfix/description`
- **Releases**: `release/v1.2.3`
- **Version tags**: `v1.2.3`

### Workflow

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Develop & Test Locally**
   ```bash
   npm test
   npm run build
   ```

3. **Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in login"
   git commit -m "docs: update README"
   ```

4. **Push & Create PR**
   ```bash
   git push origin feature/my-feature
   # Create PR to develop
   ```

5. **PR Review & Merge**
   - All checks pass ✅
   - Code reviewed by team
   - Approved
   - Merge to `develop`
   - **Automatic staging deployment**

6. **Production Release**
   ```bash
   # After testing on staging
   git checkout main
   git merge develop
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin main --tags
   # Manual approval required
   # **Production deployment**
   ```

---

## Deployment Process

### Staging Deployment

**Automatic** on push to `develop`:

1. Code pushed to `develop`
2. Build & test automatically
3. Deploy to Firebase Hosting (staging channel)
4. Run smoke tests
5. Slack notification sent

**Manual deployment**:

```bash
# In GitHub UI
Actions → Deploy to Staging → Run workflow
# Or via CLI
gh workflow run deploy-staging.yml
```

### Production Deployment

**From main branch**:

1. Merge `develop` to `main`
2. Push to GitHub
3. Wait for all checks
4. **Manual approval required**
5. After approval, auto-deploy
6. Smoke tests run
7. Team notified

**From version tag**:

```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
# Follow steps 3-7 above
```

**Manual deployment** (emergency):

```bash
# In GitHub UI
Actions → Deploy to Production → Run workflow
# Enter "DEPLOY" to confirm
```

---

## Rollback Procedures

### Automatic Rollback

If smoke tests fail, a GitHub issue comment is created alerting the team.

### Manual Rollback

#### Option 1: Revert via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project → Hosting
3. View deployment history
4. Click "Rollback" on previous version

#### Option 2: Deploy Previous Version

```bash
git checkout v1.2.2  # Previous good version
gh workflow run deploy-production.yml --ref v1.2.2
# Type "DEPLOY" to confirm
```

#### Option 3: Revert Commit

```bash
git revert <commit-sha>
git push origin main
# Triggers automatic deployment
```

---

## Monitoring

### Deployment Status

- **GitHub Actions**: [Repository Actions Tab](https://github.com/your-org/your-repo/actions)
- **Firebase Console**: [Firebase Hosting](https://console.firebase.google.com)
- **Sentry**: [Error Tracking Dashboard](https://sentry.io)

### Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build Time | < 5 min | TBD |
| Deploy Time | < 3 min | TBD |
| Test Coverage | > 70% | ~40% |
| E2E Success Rate | > 95% | TBD |
| Deployment Success | > 99% | TBD |

### Alerts

**Slack Channels**:
- `#deployments` - All deployment notifications
- `#ci-failures` - Failed builds and tests
- `#security-alerts` - Security scan failures

**Who to Contact**:
- Build failures: DevOps team
- Test failures: QA team
- Security issues: Security team
- Production incidents: On-call engineer

---

## Troubleshooting

### Build Failures

```bash
# Run build locally
npm run build

# Check for linting errors
npm run lint

# Run tests
npm run test:run
```

### Deployment Failures

1. Check GitHub Actions logs
2. Verify all secrets are configured
3. Check Firebase project quotas
4. Verify service account permissions

### Test Failures

```bash
# Run tests locally with verbose output
npm run test:run -- --reporter=verbose

# Run specific test file
npm run test:run src/path/to/test.js

# Run E2E tests locally
npm run test:e2e:headed
```

### Secret Issues

1. Go to **Settings → Secrets and variables → Actions**
2. Verify all required secrets exist
3. Update expired credentials
4. Check secret names match workflow files exactly

---

## Best Practices

### Commits

- ✅ Use conventional commits
- ✅ Keep commits atomic and focused
- ✅ Write descriptive commit messages
- ✅ Reference issue numbers (`fixes #123`)

### Pull Requests

- ✅ Keep PRs small and focused
- ✅ Include tests for new features
- ✅ Update documentation
- ✅ Wait for all checks to pass
- ✅ Get at least one approval

### Deployments

- ✅ Test on staging first
- ✅ Deploy during low-traffic hours
- ✅ Monitor for errors after deployment
- ✅ Keep team informed
- ✅ Document changes in CHANGELOG

### Security

- ✅ Never commit secrets
- ✅ Rotate credentials regularly
- ✅ Use environment-specific configs
- ✅ Review dependency updates
- ✅ Monitor security advisories

---

## Maintenance

### Weekly Tasks

- [ ] Review Dependabot PRs
- [ ] Check deployment metrics
- [ ] Review failed builds
- [ ] Update documentation

### Monthly Tasks

- [ ] Rotate API keys
- [ ] Review and update workflows
- [ ] Audit GitHub Actions logs
- [ ] Clean up old artifacts

### Quarterly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Team retrospective on CI/CD
- [ ] Update emergency procedures

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Playwright Documentation](https://playwright.dev)
- [Conventional Commits](https://www.conventionalcommits.org)

---

## Support

For CI/CD issues or questions:
- **Slack**: #devops
- **Email**: devops@yourcompany.com
- **On-call**: PagerDuty rotation

---

*Last updated: 2025-01-12*
