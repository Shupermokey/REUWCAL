# Backup and Recovery Strategy

This document outlines the backup and disaster recovery strategy for the REUWCAL application.

## Table of Contents
- [Overview](#overview)
- [Backup Strategy](#backup-strategy)
- [Recovery Procedures](#recovery-procedures)
- [Firestore Backup](#firestore-backup)
- [Storage Backup](#storage-backup)
- [Configuration Backup](#configuration-backup)
- [Disaster Recovery Plan](#disaster-recovery-plan)
- [Testing & Validation](#testing--validation)

---

## Overview

### Backup Objectives

- **RPO (Recovery Point Objective):** < 1 hour
- **RTO (Recovery Time Objective):** < 4 hours
- **Data Retention:** 30 days for daily backups, 1 year for monthly
- **Backup Frequency:** Daily automated backups

### Scope

What is backed up:
- ✅ Firestore database (all collections)
- ✅ Firebase Storage (user files)
- ✅ Firebase Security Rules
- ✅ Firebase configuration
- ✅ Application code (Git)
- ✅ Environment variables (encrypted)
- ✅ CI/CD configurations

What is NOT backed up:
- ❌ Firebase Authentication users (managed by Firebase)
- ❌ Stripe data (managed by Stripe)
- ❌ Sentry data (managed by Sentry)
- ❌ Analytics data (managed by Firebase/Google Analytics)

---

## Backup Strategy

### 1. Firestore Database Backup

#### Automated Daily Backups

Firebase provides automatic backups through Cloud Firestore managed backups.

**Setup:**
```bash
# Enable Firestore backups
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=30d

# List backup schedules
gcloud firestore backups schedules list

# List available backups
gcloud firestore backups list
```

#### Manual Backup (On-Demand)

```bash
# Create manual backup
gcloud firestore export gs://[BACKUP_BUCKET]/firestore/$(date +%Y-%m-%d) \
  --async

# Export specific collections
gcloud firestore export gs://[BACKUP_BUCKET]/firestore/$(date +%Y-%m-%d) \
  --collection-ids=users,properties,customers
```

#### Backup Verification Script

Create `scripts/verify-backup.js`:

```javascript
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

async function verifyBackup(backupPath) {
  const storage = new Storage();
  const bucket = storage.bucket('your-backup-bucket');

  try {
    const [files] = await bucket.getFiles({
      prefix: backupPath,
    });

    if (files.length === 0) {
      throw new Error('No backup files found');
    }

    console.log(`✅ Backup verified: ${files.length} files found`);
    console.log('Backup files:');
    files.forEach(file => console.log(`  - ${file.name}`));

    return true;
  } catch (error) {
    console.error('❌ Backup verification failed:', error);
    return false;
  }
}

// Run verification
const backupPath = `firestore/${process.argv[2] || new Date().toISOString().split('T')[0]}`;
verifyBackup(backupPath);
```

### 2. Firebase Storage Backup

#### Using gsutil for Storage Backup

```bash
# Backup entire storage bucket
gsutil -m rsync -r gs://[SOURCE_BUCKET] gs://[BACKUP_BUCKET]/storage/$(date +%Y-%m-%d)

# Backup specific folders
gsutil -m rsync -r gs://[SOURCE_BUCKET]/users gs://[BACKUP_BUCKET]/storage/$(date +%Y-%m-%d)/users
```

#### Automated Storage Backup Script

Create `scripts/backup-storage.sh`:

```bash
#!/bin/bash

# Configuration
SOURCE_BUCKET="your-project.appspot.com"
BACKUP_BUCKET="your-project-backups"
DATE=$(date +%Y-%m-%d)
BACKUP_PATH="storage/${DATE}"

echo "📦 Starting Firebase Storage backup..."
echo "Source: gs://${SOURCE_BUCKET}"
echo "Destination: gs://${BACKUP_BUCKET}/${BACKUP_PATH}"

# Create backup
gsutil -m rsync -r \
  -x ".*\.tmp$|.*\.temp$" \
  gs://${SOURCE_BUCKET} \
  gs://${BACKUP_BUCKET}/${BACKUP_PATH}

# Verify backup
FILE_COUNT=$(gsutil ls -r gs://${BACKUP_BUCKET}/${BACKUP_PATH} | wc -l)

if [ $FILE_COUNT -gt 0 ]; then
  echo "✅ Backup completed: ${FILE_COUNT} files backed up"
  echo "Backup location: gs://${BACKUP_BUCKET}/${BACKUP_PATH}"
else
  echo "❌ Backup failed: No files found"
  exit 1
fi

# Cleanup old backups (keep 30 days)
echo "🧹 Cleaning up old backups..."
gsutil -m rm -r gs://${BACKUP_BUCKET}/storage/$(date -d '30 days ago' +%Y-%m-%d) 2>/dev/null || true

echo "✅ Storage backup complete"
```

Make executable:
```bash
chmod +x scripts/backup-storage.sh
```

### 3. Configuration Backup

#### Firebase Configuration Export

```bash
# Export Firestore rules
firebase firestore:rules:get > backups/firestore.rules

# Export Storage rules
firebase storage:rules:get > backups/storage.rules

# Export Firestore indexes
firebase firestore:indexes > backups/firestore.indexes.json

# Export hosting configuration
cp firebase.json backups/firebase.json
```

#### Automated Configuration Backup

Create `scripts/backup-config.sh`:

```bash
#!/bin/bash

BACKUP_DIR="backups/config/$(date +%Y-%m-%d)"
mkdir -p ${BACKUP_DIR}

echo "📋 Backing up Firebase configuration..."

# Firestore rules
firebase firestore:rules:get > ${BACKUP_DIR}/firestore.rules
echo "✅ Firestore rules backed up"

# Storage rules
firebase storage:rules:get > ${BACKUP_DIR}/storage.rules
echo "✅ Storage rules backed up"

# Firestore indexes
firebase firestore:indexes > ${BACKUP_DIR}/firestore.indexes.json
echo "✅ Firestore indexes backed up"

# Firebase configuration
cp firebase.json ${BACKUP_DIR}/firebase.json
echo "✅ Firebase config backed up"

# Security rules
cp firestore.rules ${BACKUP_DIR}/firestore.rules.local
cp storage.rules ${BACKUP_DIR}/storage.rules.local
echo "✅ Security rules backed up"

# Environment template
cp frontend/.env.example ${BACKUP_DIR}/.env.example
echo "✅ Environment template backed up"

echo "✅ Configuration backup complete: ${BACKUP_DIR}"

# Commit to Git
git add ${BACKUP_DIR}
git commit -m "chore: automated config backup $(date +%Y-%m-%d)" || true
```

---

## Recovery Procedures

### 1. Firestore Database Recovery

#### Full Database Restore

```bash
# List available backups
gcloud firestore backups list

# Restore from specific backup
gcloud firestore import gs://[BACKUP_BUCKET]/firestore/[BACKUP_DATE] \
  --async

# Monitor restore progress
gcloud firestore operations list
```

#### Partial Collection Restore

```bash
# Restore specific collections
gcloud firestore import gs://[BACKUP_BUCKET]/firestore/[BACKUP_DATE] \
  --collection-ids=users,properties \
  --async
```

#### Recovery Script

Create `scripts/restore-firestore.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function restoreCollection(backupData, collectionName) {
  const batch = db.batch();
  let count = 0;

  backupData[collectionName].forEach((doc) => {
    const docRef = db.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc.data);
    count++;

    // Commit every 500 documents
    if (count % 500 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  });

  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Restored ${count} documents to ${collectionName}`);
}

// Usage
// node scripts/restore-firestore.js backup-data.json collection-name
```

### 2. Firebase Storage Recovery

#### Full Storage Restore

```bash
# Restore from backup
gsutil -m rsync -r \
  gs://[BACKUP_BUCKET]/storage/[BACKUP_DATE] \
  gs://[SOURCE_BUCKET]

# Verify restoration
gsutil ls -r gs://[SOURCE_BUCKET]
```

#### Partial Restore (Specific User)

```bash
# Restore specific user's files
gsutil -m rsync -r \
  gs://[BACKUP_BUCKET]/storage/[BACKUP_DATE]/users/[USER_ID] \
  gs://[SOURCE_BUCKET]/users/[USER_ID]
```

### 3. Configuration Recovery

```bash
# Restore Firestore rules
firebase deploy --only firestore:rules

# Restore Storage rules
firebase deploy --only storage:rules

# Restore Firestore indexes
firebase deploy --only firestore:indexes

# Restore hosting configuration
firebase deploy --only hosting
```

---

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Detection:**
- User reports missing data
- Monitoring alerts show data loss

**Recovery Steps:**
1. Identify affected data and time of deletion
2. Find most recent backup before deletion
3. Extract affected data from backup
4. Restore only affected data (avoid overwriting new data)
5. Verify data integrity
6. Notify affected users

**Timeline:** 1-2 hours

### Scenario 2: Database Corruption

**Detection:**
- Application errors
- Data integrity issues
- Firestore errors

**Recovery Steps:**
1. Take immediate snapshot of current state
2. Identify last known good backup
3. Restore from backup to staging environment
4. Verify data integrity in staging
5. Switch application to maintenance mode
6. Restore to production
7. Verify application functionality
8. Exit maintenance mode

**Timeline:** 2-4 hours

### Scenario 3: Complete Project Loss

**Detection:**
- Firebase project deleted
- Catastrophic failure

**Recovery Steps:**
1. Create new Firebase project
2. Restore configuration from Git backups
3. Restore Firestore database from Cloud Storage backup
4. Restore Storage files from backup bucket
5. Update environment variables
6. Deploy application code from Git
7. Update DNS/domain configuration
8. Restore Firebase Security Rules
9. Test all functionality
10. Notify users of temporary service disruption

**Timeline:** 4-8 hours

### Scenario 4: Region Outage

**Detection:**
- Firebase Console shows region unavailable
- Application unresponsive

**Recovery Steps:**
1. Monitor Firebase Status Dashboard
2. If extended outage, activate disaster recovery
3. Deploy to alternative region (if multi-region setup)
4. Update DNS to point to backup region
5. Notify users of degraded service

**Timeline:** Depends on Firebase SLA

---

## Automated Backup Schedule

### Daily Backups (Automated)

```yaml
# .github/workflows/daily-backup.yml
name: Daily Backup

on:
  schedule:
    # Run at 2 AM UTC daily
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}

      - name: Backup Firestore
        run: |
          gcloud firestore export gs://${{ secrets.BACKUP_BUCKET }}/firestore/$(date +%Y-%m-%d) \
            --async

      - name: Backup Storage
        run: |
          gsutil -m rsync -r \
            gs://${{ secrets.SOURCE_BUCKET }} \
            gs://${{ secrets.BACKUP_BUCKET }}/storage/$(date +%Y-%m-%d)

      - name: Backup Configuration
        run: |
          bash scripts/backup-config.sh

      - name: Verify Backups
        run: |
          node scripts/verify-backup.js $(date +%Y-%m-%d)

      - name: Send Notification
        if: failure()
        run: |
          # Send alert to Slack/Discord/Email
          echo "Backup failed on $(date)"
```

### Weekly Verification (Automated)

```yaml
# .github/workflows/weekly-backup-test.yml
name: Weekly Backup Verification

on:
  schedule:
    # Run every Sunday at 3 AM UTC
    - cron: '0 3 * * 0'
  workflow_dispatch:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Restore to Test Environment
        run: |
          # Restore latest backup to test project
          gcloud firestore import gs://${{ secrets.BACKUP_BUCKET }}/firestore/latest \
            --project=${{ secrets.TEST_PROJECT_ID }}

      - name: Run Integration Tests
        run: |
          npm run test:integration

      - name: Verify Data Integrity
        run: |
          node scripts/verify-data-integrity.js

      - name: Report Results
        run: |
          # Send report to team
          echo "Backup verification complete"
```

---

## Monitoring & Alerts

### Backup Monitoring

Set up alerts for:
- ❌ Backup job failures
- ⚠️ Backup size anomalies (too small = data loss)
- ⚠️ Backup not completed within expected time
- ❌ Backup verification failures

### Alert Channels
- Email to operations team
- Slack/Discord notifications
- PagerDuty for critical failures

### Health Checks

```javascript
// scripts/backup-health-check.js
const { Storage } = require('@google-cloud/storage');

async function checkBackupHealth() {
  const storage = new Storage();
  const bucket = storage.bucket('your-backup-bucket');
  const today = new Date().toISOString().split('T')[0];

  const checks = {
    firestoreBackup: false,
    storageBackup: false,
    configBackup: false,
  };

  // Check Firestore backup
  const [firestoreFiles] = await bucket.getFiles({
    prefix: `firestore/${today}`,
  });
  checks.firestoreBackup = firestoreFiles.length > 0;

  // Check Storage backup
  const [storageFiles] = await bucket.getFiles({
    prefix: `storage/${today}`,
  });
  checks.storageBackup = storageFiles.length > 0;

  // Check config backup
  const [configFiles] = await bucket.getFiles({
    prefix: `config/${today}`,
  });
  checks.configBackup = configFiles.length > 0;

  const allHealthy = Object.values(checks).every(check => check === true);

  if (!allHealthy) {
    console.error('❌ Backup health check failed:', checks);
    process.exit(1);
  }

  console.log('✅ All backups healthy');
  return checks;
}

checkBackupHealth();
```

---

## Testing & Validation

### Monthly Recovery Drill

1. **Schedule:** First Sunday of each month
2. **Duration:** 2-4 hours
3. **Participants:** Engineering team
4. **Objective:** Verify recovery procedures

**Drill Steps:**
1. Select random backup from previous week
2. Restore to test environment
3. Verify data integrity
4. Test application functionality
5. Document any issues
6. Update recovery procedures

### Recovery Testing Checklist

- [ ] Test Firestore full restore
- [ ] Test Firestore partial restore
- [ ] Test Storage full restore
- [ ] Test Storage partial restore
- [ ] Test configuration restore
- [ ] Test application deployment from scratch
- [ ] Verify all data accessible
- [ ] Verify all features working
- [ ] Time the recovery process
- [ ] Document lessons learned

---

## Backup Retention Policy

### Firestore Database
- **Daily backups:** 30 days
- **Weekly backups:** 12 weeks
- **Monthly backups:** 12 months

### Firebase Storage
- **Daily backups:** 30 days
- **Monthly backups:** 12 months

### Configuration
- **All versions:** Kept in Git (indefinite)
- **Automated exports:** 90 days

### Cleanup Script

```bash
#!/bin/bash
# scripts/cleanup-old-backups.sh

BACKUP_BUCKET="your-backup-bucket"
RETENTION_DAYS=30

# Calculate cutoff date
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)

echo "🧹 Cleaning up backups older than ${CUTOFF_DATE}..."

# List and delete old backups
gsutil ls gs://${BACKUP_BUCKET}/firestore/ | while read backup_path; do
  backup_date=$(echo $backup_path | grep -oP '\d{4}-\d{2}-\d{2}')
  if [[ "$backup_date" < "$CUTOFF_DATE" ]]; then
    echo "Deleting old backup: $backup_path"
    gsutil -m rm -r $backup_path
  fi
done

echo "✅ Cleanup complete"
```

---

## Emergency Contacts

### Primary Contacts
- **Engineering Lead:** [Name] - [Email] - [Phone]
- **DevOps Lead:** [Name] - [Email] - [Phone]
- **CTO:** [Name] - [Email] - [Phone]

### Vendor Support
- **Firebase Support:** https://firebase.google.com/support
- **GCP Support:** https://cloud.google.com/support
- **Stripe Support:** https://support.stripe.com

---

## Compliance & Audit

### Data Protection Compliance
- GDPR: User data can be restored upon request
- CCPA: Backup data includes user deletion logs
- SOC 2: Backup and recovery procedures documented

### Audit Trail
- All backup operations logged
- Restoration events logged with operator ID
- Access to backups restricted and monitored

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-12
- **Next Review:** 2025-12-12
- **Owner:** DevOps Team
