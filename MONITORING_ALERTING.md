# Monitoring and Alerting Strategy

This document outlines the monitoring and alerting strategy for the REUWCAL application in production.

## Table of Contents
- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Application Monitoring](#application-monitoring)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Alert Configuration](#alert-configuration)
- [Dashboards](#dashboards)
- [Incident Response](#incident-response)

---

## Overview

### Monitoring Objectives

- **Availability:** 99.9% uptime
- **Performance:** Sub-second response times
- **Error Rate:** < 0.1% of requests
- **User Experience:** Monitor Core Web Vitals
- **Security:** Detect anomalies and attacks

### Key Metrics

**Golden Signals:**
1. **Latency:** How long it takes to serve a request
2. **Traffic:** How much demand is being placed on the system
3. **Errors:** The rate of requests that fail
4. **Saturation:** How "full" the service is

---

## Monitoring Stack

### Tools Overview

| Tool | Purpose | Cost |
|------|---------|------|
| Sentry | Error tracking, performance | Free tier available |
| Firebase Analytics | User behavior, events | Free |
| Google Cloud Monitoring | Infrastructure, Firestore | Free tier available |
| UptimeRobot | Uptime monitoring | Free tier available |
| Web Vitals | Performance metrics | Free |
| Custom Logging | Application logs | Firebase/GCP |

---

## Application Monitoring

### 1. Error Tracking (Sentry)

#### Configuration

Already configured in `src/config/sentry.js`. Monitors:
- JavaScript exceptions
- React error boundaries
- Unhandled promise rejections
- Network errors
- Performance issues

#### Error Alerts

Configure Sentry alerts for:

**Critical Errors (Immediate):**
- Error rate > 1% in 5 minutes
- New error types
- Error affecting > 10 users
- Payment/checkout errors

**Warning Errors (15 min delay):**
- Error rate > 0.5% in 15 minutes
- Authentication errors spike
- Database operation failures

**Sentry Alert Rules:**
```javascript
// In Sentry Dashboard: Alerts → Create Alert Rule

// Critical: High error rate
{
  "name": "High Error Rate",
  "conditions": [
    {
      "metric": "error_count",
      "operator": ">",
      "value": 10,
      "window": 300 // 5 minutes
    }
  ],
  "actions": [
    "email",
    "slack",
    "pagerduty"
  ]
}

// Critical: Payment errors
{
  "name": "Payment Errors",
  "conditions": [
    {
      "filter": "error.type:stripe/*",
      "count": ">",
      "value": 1
    }
  ],
  "actions": [
    "email",
    "slack"
  ]
}
```

### 2. Performance Monitoring

#### Web Vitals Tracking

Already configured in `src/utils/webVitals.js`. Tracks:
- **LCP (Largest Contentful Paint):** < 2.5s (good)
- **FID/INP (Interactivity):** < 100ms / 200ms (good)
- **CLS (Cumulative Layout Shift):** < 0.1 (good)
- **FCP (First Contentful Paint):** < 1.8s (good)
- **TTFB (Time to First Byte):** < 800ms (good)

#### Performance Budget

Create `performance-budget.json`:
```json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        {
          "metric": "first-contentful-paint",
          "budget": 1800
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 2500
        },
        {
          "metric": "interactive",
          "budget": 3000
        }
      ],
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "total",
          "budget": 500
        }
      ]
    }
  ]
}
```

#### Custom Performance Tracking

```javascript
// src/utils/performanceMonitoring.js
import * as Sentry from '@sentry/react';
import { trackEvent } from '@/config/analytics';

export class PerformanceMonitor {
  static measureOperation(name, operation) {
    const startTime = performance.now();

    return operation().then((result) => {
      const duration = performance.now() - startTime;

      // Track in Analytics
      trackEvent('operation_performance', {
        operation: name,
        duration: Math.round(duration),
        status: 'success'
      });

      // Track in Sentry if slow
      if (duration > 3000) {
        Sentry.captureMessage(`Slow operation: ${name}`, {
          level: 'warning',
          extra: { duration }
        });
      }

      return result;
    }).catch((error) => {
      const duration = performance.now() - startTime;

      trackEvent('operation_performance', {
        operation: name,
        duration: Math.round(duration),
        status: 'error'
      });

      throw error;
    });
  }

  static measurePageLoad() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];

      trackEvent('page_load', {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart
      });
    });
  }
}

// Usage
export default PerformanceMonitor;
```

### 3. User Analytics (Firebase)

Already configured in `src/config/analytics.js`.

#### Custom Events Tracking

**User Engagement:**
- Page views
- Session duration
- Feature usage
- Conversion funnels

**Business Metrics:**
- Property creation rate
- Income statement saves
- Subscription conversions
- User retention

**Example Tracking:**
```javascript
import { Analytics } from '@/config/analytics';

// Track feature usage
Analytics.property.create();
Analytics.income.save(propertyId);
Analytics.subscription.purchase('Pro', 29.99);
```

### 4. API Monitoring

#### Firestore Operation Tracking

```javascript
// src/services/monitoring/firestoreMonitoring.js
import { trackEvent } from '@/config/analytics';
import * as Sentry from '@sentry/react';

export function monitorFirestoreOperation(operation, collection) {
  const startTime = performance.now();

  return {
    success: () => {
      const duration = performance.now() - startTime;

      trackEvent('firestore_operation', {
        operation,
        collection,
        duration: Math.round(duration),
        status: 'success'
      });

      // Alert if slow
      if (duration > 5000) {
        Sentry.captureMessage(`Slow Firestore operation: ${operation} on ${collection}`, {
          level: 'warning',
          extra: { duration }
        });
      }
    },

    error: (error) => {
      const duration = performance.now() - startTime;

      trackEvent('firestore_operation', {
        operation,
        collection,
        duration: Math.round(duration),
        status: 'error',
        error_code: error.code
      });

      Sentry.captureException(error, {
        tags: {
          operation,
          collection
        }
      });
    }
  };
}

// Usage in firestoreService.js
export async function getProperties(userId) {
  const monitor = monitorFirestoreOperation('read', 'properties');

  try {
    const colRef = collection(db, `users/${userId}/properties`);
    const snapshot = await getDocs(colRef);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    monitor.success();
    return data;
  } catch (error) {
    monitor.error(error);
    throw error;
  }
}
```

---

## Infrastructure Monitoring

### 1. Firebase Monitoring

Firebase provides built-in monitoring through Google Cloud Console.

**Key Metrics to Track:**

#### Firestore
- Read/Write operations per second
- Document count growth
- Storage usage
- Query latency
- Error rate

#### Storage
- Storage usage
- Bandwidth usage
- Request count
- Error rate

#### Hosting
- Request count
- Bandwidth usage
- Cache hit ratio
- Error rate (4xx, 5xx)

#### Authentication
- Sign-up rate
- Sign-in rate
- Error rate

**Access:** https://console.cloud.google.com/monitoring

### 2. Uptime Monitoring

#### UptimeRobot Configuration

Monitor these endpoints:

```yaml
# Production endpoints to monitor
monitors:
  - name: "Homepage"
    url: "https://yourapp.com"
    interval: 5 # minutes
    alert_threshold: 2 # failures before alert

  - name: "API Health"
    url: "https://yourapp.com/api/health"
    interval: 5
    alert_threshold: 2

  - name: "Authentication"
    url: "https://yourapp.com/login"
    interval: 10
    alert_threshold: 2

  - name: "Pricing Page"
    url: "https://yourapp.com/pricing"
    interval: 10
    alert_threshold: 2
```

**Setup:**
1. Sign up at https://uptimerobot.com
2. Add monitors for each endpoint
3. Configure alert contacts (email, Slack)
4. Set up status page (public or private)

#### Health Check Endpoint

Create `public/api/health.json`:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T00:00:00Z",
  "version": "1.0.0",
  "checks": {
    "frontend": "ok",
    "firebase": "ok"
  }
}
```

### 3. Custom Health Checks

```javascript
// scripts/health-check.js
const https = require('https');
const admin = require('firebase-admin');

async function checkHealth() {
  const checks = {
    frontend: false,
    firestore: false,
    storage: false,
    auth: false
  };

  // Check frontend
  try {
    await new Promise((resolve, reject) => {
      https.get('https://yourapp.com', (res) => {
        checks.frontend = res.statusCode === 200;
        resolve();
      }).on('error', reject);
    });
  } catch (error) {
    console.error('Frontend check failed:', error);
  }

  // Check Firestore
  try {
    const db = admin.firestore();
    await db.collection('_health').doc('check').get();
    checks.firestore = true;
  } catch (error) {
    console.error('Firestore check failed:', error);
  }

  // Check Storage
  try {
    const bucket = admin.storage().bucket();
    await bucket.exists();
    checks.storage = true;
  } catch (error) {
    console.error('Storage check failed:', error);
  }

  // Check Auth
  try {
    await admin.auth().listUsers(1);
    checks.auth = true;
  } catch (error) {
    console.error('Auth check failed:', error);
  }

  const allHealthy = Object.values(checks).every(check => check === true);

  console.log('Health Check Results:', checks);

  if (!allHealthy) {
    console.error('❌ Health check failed');
    process.exit(1);
  }

  console.log('✅ All systems healthy');
  return checks;
}

// Run every 5 minutes
setInterval(checkHealth, 5 * 60 * 1000);
checkHealth();
```

---

## Alert Configuration

### Alert Severity Levels

| Severity | Response Time | Notification | On-Call |
|----------|--------------|--------------|---------|
| **P0 (Critical)** | < 15 min | Email, Slack, SMS, PagerDuty | Yes |
| **P1 (High)** | < 1 hour | Email, Slack | Yes |
| **P2 (Medium)** | < 4 hours | Email, Slack | No |
| **P3 (Low)** | < 24 hours | Email | No |

### Alert Types

#### P0 - Critical

- 🔴 Application completely down
- 🔴 Database unavailable
- 🔴 Payment system failure
- 🔴 Data loss detected
- 🔴 Security breach detected

#### P1 - High

- 🟠 Error rate > 5%
- 🟠 API response time > 5s
- 🟠 Partial service outage
- 🟠 Authentication failures spike

#### P2 - Medium

- 🟡 Error rate > 1%
- 🟡 API response time > 2s
- 🟡 Unusual traffic patterns
- 🟡 Resource usage high (> 80%)

#### P3 - Low

- 🟢 Minor performance degradation
- 🟢 Non-critical feature errors
- 🟢 Warning-level logs increase

### Notification Channels

#### Slack Integration

```javascript
// scripts/slack-alert.js
async function sendSlackAlert(severity, message, details = {}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const color = {
    P0: '#FF0000', // Red
    P1: '#FFA500', // Orange
    P2: '#FFFF00', // Yellow
    P3: '#00FF00'  // Green
  }[severity];

  const payload = {
    attachments: [
      {
        color,
        title: `${severity} Alert: ${message}`,
        fields: Object.entries(details).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })),
        footer: 'REUWCAL Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

module.exports = { sendSlackAlert };
```

#### Email Alerts

Use SendGrid or similar service:

```javascript
// scripts/email-alert.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmailAlert(severity, subject, body) {
  const recipients = {
    P0: ['oncall@yourapp.com', 'cto@yourapp.com'],
    P1: ['oncall@yourapp.com', 'engineering@yourapp.com'],
    P2: ['engineering@yourapp.com'],
    P3: ['engineering@yourapp.com']
  }[severity];

  const msg = {
    to: recipients,
    from: 'alerts@yourapp.com',
    subject: `[${severity}] ${subject}`,
    text: body,
    html: `<strong>${body}</strong>`
  };

  await sgMail.sendMultiple(msg);
}

module.exports = { sendEmailAlert };
```

---

## Dashboards

### 1. Operations Dashboard (Real-time)

**Metrics:**
- Current active users
- Requests per minute
- Error rate (last hour)
- Average response time
- System health status

**Tools:** Google Cloud Monitoring, Grafana, or custom

### 2. Business Dashboard (Daily)

**Metrics:**
- New user signups
- Active properties
- Subscription conversions
- Revenue (via Stripe)
- User retention

**Tools:** Firebase Analytics, Stripe Dashboard, or custom

### 3. Performance Dashboard (Weekly)

**Metrics:**
- Average page load time
- Core Web Vitals trends
- Bundle size over time
- API latency trends
- Cache hit ratio

**Tools:** Lighthouse CI, Firebase Performance

### Custom Dashboard

```html
<!-- dashboards/operations.html -->
<!DOCTYPE html>
<html>
<head>
  <title>REUWCAL Operations Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>REUWCAL Operations Dashboard</h1>

  <div class="metrics">
    <div class="metric">
      <h2>Active Users</h2>
      <p id="active-users">Loading...</p>
    </div>

    <div class="metric">
      <h2>Error Rate</h2>
      <p id="error-rate">Loading...</p>
    </div>

    <div class="metric">
      <h2>Avg Response Time</h2>
      <p id="response-time">Loading...</p>
    </div>

    <div class="metric">
      <h2>System Status</h2>
      <p id="system-status">Loading...</p>
    </div>
  </div>

  <canvas id="metrics-chart"></canvas>

  <script>
    // Fetch metrics from monitoring API
    async function loadMetrics() {
      const response = await fetch('/api/metrics');
      const data = await response.json();

      document.getElementById('active-users').textContent = data.activeUsers;
      document.getElementById('error-rate').textContent = `${data.errorRate}%`;
      document.getElementById('response-time').textContent = `${data.avgResponseTime}ms`;
      document.getElementById('system-status').textContent = data.status;

      updateChart(data.timeSeries);
    }

    function updateChart(timeSeries) {
      const ctx = document.getElementById('metrics-chart');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: timeSeries.timestamps,
          datasets: [{
            label: 'Requests/min',
            data: timeSeries.requests,
            borderColor: 'rgb(75, 192, 192)',
          }, {
            label: 'Errors/min',
            data: timeSeries.errors,
            borderColor: 'rgb(255, 99, 132)',
          }]
        }
      });
    }

    // Refresh every 30 seconds
    loadMetrics();
    setInterval(loadMetrics, 30000);
  </script>
</body>
</html>
```

---

## Incident Response

### Incident Response Plan

#### 1. Detection
- Alert received via Slack/Email/PagerDuty
- User report
- Monitoring dashboard shows anomaly

#### 2. Acknowledgment
- On-call engineer acknowledges alert (< 5 min)
- Create incident in tracking system
- Notify team in incident channel

#### 3. Investigation
- Check monitoring dashboards
- Review error logs in Sentry
- Check Firebase Console
- Review recent deployments

#### 4. Mitigation
- Implement temporary fix
- Roll back if needed
- Scale resources if needed

#### 5. Resolution
- Deploy permanent fix
- Verify resolution
- Update monitoring

#### 6. Post-Mortem
- Document timeline
- Identify root cause
- Create action items
- Update runbooks

### Incident Runbooks

#### High Error Rate

```markdown
## Runbook: High Error Rate

**Symptoms:**
- Error rate > 5%
- Sentry alerts firing
- User complaints

**Investigation:**
1. Check Sentry dashboard for error types
2. Review recent deployments
3. Check Firebase Console for service issues
4. Review browser console errors

**Common Causes:**
- Recent deployment with bugs
- API endpoint issues
- Third-party service outage (Stripe, Firebase)
- Client-side JavaScript errors

**Resolution:**
1. If recent deployment: rollback
2. If API issue: check Firebase status
3. If third-party: wait for service restoration
4. If client error: hotfix and deploy

**Communication:**
- Update status page
- Notify affected users
- Post in #incidents channel
```

#### Database Performance Issues

```markdown
## Runbook: Slow Database Queries

**Symptoms:**
- API response time > 3s
- Timeouts in Firestore
- User reports slow loading

**Investigation:**
1. Check Firestore metrics in GCP Console
2. Review slow query logs
3. Check for missing indexes
4. Review concurrent connections

**Common Causes:**
- Missing database indexes
- Inefficient queries
- Large collection scans
- High concurrent load

**Resolution:**
1. Add missing indexes
2. Optimize queries
3. Implement caching
4. Scale Firestore capacity

**Prevention:**
- Add indexes for new queries
- Test queries with production data
- Monitor query performance
- Implement query caching
```

---

## Monitoring Checklist

### Daily
- [ ] Review error rate in Sentry
- [ ] Check uptime status
- [ ] Review performance metrics
- [ ] Check backup status

### Weekly
- [ ] Review performance trends
- [ ] Analyze user behavior patterns
- [ ] Check resource utilization
- [ ] Review alert effectiveness

### Monthly
- [ ] Performance audit (Lighthouse)
- [ ] Security scan
- [ ] Dependency updates review
- [ ] Incident retrospective

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-12
- **Next Review:** 2025-12-12
- **Owner:** DevOps Team
