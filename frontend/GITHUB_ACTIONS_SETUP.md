# GitHub Actions Setup Guide

## What You Have

You pushed to GitHub with these workflows ready:
- ✅ **PR Checks** (`pr-checks.yml`) - Runs tests on every Pull Request
- ✅ **Deploy Staging** (`deploy-staging.yml`) - Auto-deploys to staging on `develop` branch
- ✅ **Deploy Production** (`deploy-production.yml`) - Deploys to production on `main` branch (with approval)

## Current Status

Right now, these workflows **won't run** because they need:
1. GitHub secrets configured
2. GitHub environments set up
3. Workflows to be in the correct location

---

## Step 1: Move Workflows to Root (REQUIRED)

GitHub Actions workflows must be in the **repository root**, not the `frontend` folder.

### Quick Fix:

```bash
# From your project root
cd /c/Users/aesob/Desktop/Projects/REUWCAL

# Move .github folder to root
mv frontend/.github .github

# Commit and push
git add .github
git commit -m "Move GitHub Actions workflows to repository root"
git push
```

**Why?** GitHub only looks for workflows in `<repo-root>/.github/workflows/`, not in subfolders.

---

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### Required Secrets:

Click **"New repository secret"** for each:

#### 1. Firebase Token
```bash
# In your terminal, run:
npm install -g firebase-tools
firebase login
firebase login:ci
# Copy the token it gives you
```
- **Name:** `FIREBASE_TOKEN`
- **Value:** Paste the token from above

#### 2. Firebase Project ID
- **Name:** `FIREBASE_PROJECT_ID`
- **Value:** Your Firebase project ID (from Firebase Console)

#### 3. Sentry Auth Token (Optional - for error tracking)
- **Name:** `SENTRY_AUTH_TOKEN`
- **Value:** Get from https://sentry.io/settings/account/api/auth-tokens/
- **Can skip for now** - workflows will work without it

---

## Step 3: Set Up GitHub Environments

Go to: **Settings** → **Environments**

### Create "staging" Environment:
1. Click **"New environment"**
2. Name: `staging`
3. No required reviewers needed
4. Click **"Configure environment"**
5. Leave defaults, save

### Create "production" Environment:
1. Click **"New environment"**
2. Name: `production`
3. ✅ **Check "Required reviewers"**
4. Add yourself as a reviewer (this makes it so you have to manually approve production deploys)
5. Click **"Configure environment"**
6. Save

**Why?** This ensures production deploys require your approval - safety first!

---

## Step 4: Enable GitHub Actions

Go to: **Settings** → **Actions** → **General**

Make sure:
- ✅ **Actions permissions:** "Allow all actions and reusable workflows"
- ✅ **Workflow permissions:** "Read and write permissions"
- ✅ **Allow GitHub Actions to create and approve pull requests:** Checked

---

## Step 5: Test It Out!

### Test PR Checks:
1. Create a new branch:
   ```bash
   git checkout -b test-ci
   ```

2. Make a small change (like updating README.md)

3. Push and create a Pull Request:
   ```bash
   git add .
   git commit -m "Test CI/CD"
   git push -u origin test-ci
   ```

4. Go to GitHub → **Pull Requests** → Create PR

5. Watch the **Actions** tab - you should see:
   - ✅ Lint running
   - ✅ Tests running
   - ✅ Build running
   - ✅ Security audit running

### Test Staging Deploy (Optional):
1. Push to `develop` branch:
   ```bash
   git checkout develop
   git merge test-ci
   git push
   ```

2. Go to **Actions** tab
3. Watch it deploy to Firebase Hosting (staging)

---

## What Each Workflow Does

### 1. PR Checks (`pr-checks.yml`)
**Triggers:** Every Pull Request
**What it does:**
- Runs ESLint (code quality)
- Runs all unit/integration tests
- Builds the app
- Runs security audit (`npm audit`)
- Runs E2E tests (if Playwright configured)
- Posts summary comment on PR

**Status:** Will work once secrets are configured ✅

---

### 2. Deploy Staging (`deploy-staging.yml`)
**Triggers:** Push to `develop` branch
**What it does:**
- Runs all checks
- Builds production bundle
- Deploys to Firebase Hosting (staging channel)
- Runs smoke tests
- Comments with preview URL

**Status:** Needs `FIREBASE_TOKEN` and `FIREBASE_PROJECT_ID` secrets

---

### 3. Deploy Production (`deploy-production.yml`)
**Triggers:** Push to `main` branch (with manual approval)
**What it does:**
- Runs all checks
- Creates backup
- **Waits for your approval** 🛑
- Deploys to production
- Runs health checks
- Can auto-rollback on failure

**Status:** Needs secrets + `production` environment with required reviewers

---

## Minimal Setup (Just Tests)

If you just want tests to run on PRs and don't care about deployment yet:

### Secrets Needed: **NONE**

Just update `pr-checks.yml` to remove the Firebase parts:

```yaml
# Comment out or remove the "deploy" job at the bottom
# Keep: lint, test, build, security jobs
```

Tests will run without any secrets!

---

## Quick Checklist

- [ ] Move `.github` folder to repository root
- [ ] Add `FIREBASE_TOKEN` secret
- [ ] Add `FIREBASE_PROJECT_ID` secret
- [ ] Create `staging` environment
- [ ] Create `production` environment (with required reviewers)
- [ ] Enable Actions in repository settings
- [ ] Create test PR to verify

---

## Troubleshooting

### "Workflow file not found"
- Make sure `.github/workflows/` is at repository root, not in `frontend/`

### "Secret not found"
- Check secret names match exactly (case-sensitive)
- `FIREBASE_TOKEN` not `firebase_token`

### "Environment not found"
- Go to Settings → Environments
- Create `staging` and `production` environments

### Tests failing in CI but pass locally
- Might be environment variable issue
- Check that `.env` variables are added as GitHub secrets if needed

---

## Where to Check Status

### Actions Tab:
- **URL:** `https://github.com/<your-username>/<repo-name>/actions`
- Shows all workflow runs
- Click on a run to see detailed logs

### Pull Requests:
- Each PR shows status checks at the bottom
- Green checkmark = all tests passed
- Red X = something failed (click to see why)

---

## Current Project Structure

Your project has:
- **Frontend:** `frontend/` folder (React + Vite)
- **Workflows:** Need to be in `.github/workflows/` (root)

The workflows are configured to:
- Change directory to `frontend/` before running commands
- Run `npm ci` (clean install)
- Run `npm run build`, `npm run test:run`, etc.

---

## Cost

GitHub Actions includes:
- ✅ **Free for public repos:** Unlimited minutes
- ✅ **Free for private repos:** 2,000 minutes/month (plenty for most projects)

Each workflow run uses ~5-10 minutes total.

---

## Next Steps

1. **Move workflows to root** (5 minutes)
2. **Add Firebase secrets** (5 minutes)
3. **Create environments** (2 minutes)
4. **Test with a PR** (see it work!)

Total setup time: **~15 minutes**

---

## Optional: Disable Specific Workflows

If you don't want auto-deployment yet:

### Disable staging deployment:
- Go to **Actions** → **deploy-staging.yml** → **...** → **Disable workflow**

### Disable production deployment:
- Go to **Actions** → **deploy-production.yml** → **...** → **Disable workflow**

Keep PR checks enabled - those are the most useful!

---

## Questions?

- **What runs on every push?** Only PR checks (on Pull Requests)
- **What runs automatically?** Staging deploy (on `develop` branch)
- **What needs approval?** Production deploy (on `main` branch)
- **What if I don't want deployment?** Disable those workflows, keep PR checks

---

## Summary

**Minimum to get tests running on GitHub:**
1. Move `.github` to repository root
2. Push to GitHub
3. Create a Pull Request
4. Tests run automatically ✅

**For full CI/CD (auto-deploy):**
1. Do above steps
2. Add Firebase secrets
3. Create environments
4. Push to `develop` → auto-deploys staging
5. Push to `main` → approve → deploys production

---

**Created:** 2025-11-13
**Status:** Ready to set up
**Time to complete:** 15-20 minutes
