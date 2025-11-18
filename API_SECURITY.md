# API Security Implementation Guide

This document outlines security measures that should be implemented in your backend API (Stripe webhooks, Cloud Functions, etc.).

## Table of Contents
- [CORS Configuration](#cors-configuration)
- [Request Validation](#request-validation)
- [Rate Limiting](#rate-limiting)
- [Authentication & Authorization](#authentication--authorization)
- [Webhook Security](#webhook-security)
- [Error Handling](#error-handling)

---

## CORS Configuration

### Firebase Cloud Functions

Add CORS middleware to your Cloud Functions:

```javascript
const cors = require('cors')({ origin: true });

exports.yourFunction = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // Your function code here
  });
});
```

### Production CORS Settings

```javascript
const allowedOrigins = [
  'https://yourapp.com',
  'https://www.yourapp.com',
  'https://staging.yourapp.com',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const cors = require('cors')(corsOptions);
```

---

## Request Validation

### Input Validation Middleware

```javascript
const { body, param, validationResult } = require('express-validator');

// Validation rules
const validateProperty = [
  body('name').isString().isLength({ min: 1, max: 200 }).trim().escape(),
  body('address').optional().isString().isLength({ max: 500 }).trim(),
  body('grossBuildingAreaSqFt')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 10000000 }),
  body('units').optional().isInt({ min: 0, max: 10000 }),
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Usage
app.post('/properties', validateProperty, validate, async (req, res) => {
  // Handler code
});
```

### Sanitization Functions

```javascript
const sanitize = {
  // Remove HTML tags
  html: (input) => {
    return input.replace(/<[^>]*>/g, '');
  },

  // Sanitize filename
  filename: (input) => {
    return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
  },

  // Sanitize user input
  input: (input) => {
    return input.trim().replace(/\0/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  },
};
```

---

## Rate Limiting

### Using express-rate-limit

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Stricter rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.',
});

// Apply to routes
app.use('/api/', apiLimiter);
app.post('/auth/login', authLimiter, loginHandler);
app.post('/auth/register', authLimiter, registerHandler);
```

### Firebase Functions Rate Limiting

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

async function checkRateLimit(uid, action) {
  const rateLimitRef = admin
    .firestore()
    .collection('rateLimits')
    .doc(`${uid}_${action}`);

  const doc = await rateLimitRef.get();
  const now = Date.now();

  if (!doc.exists) {
    await rateLimitRef.set({
      count: 1,
      resetTime: now + 60000, // 1 minute window
    });
    return true;
  }

  const data = doc.data();

  // Reset if window expired
  if (now > data.resetTime) {
    await rateLimitRef.set({
      count: 1,
      resetTime: now + 60000,
    });
    return true;
  }

  // Check if under limit
  if (data.count < 10) {
    await rateLimitRef.update({
      count: admin.firestore.FieldValue.increment(1),
    });
    return true;
  }

  return false;
}

// Usage in Cloud Function
exports.createProperty = functions.https.onCall(async (data, context) => {
  const uid = context.auth.uid;

  // Check rate limit
  const allowed = await checkRateLimit(uid, 'createProperty');
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }

  // Your function code
});
```

---

## Authentication & Authorization

### Verify Firebase ID Token

```javascript
const admin = require('firebase-admin');

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Usage
app.get('/api/protected', authenticateUser, (req, res) => {
  res.json({ message: 'Authenticated!', uid: req.user.uid });
});
```

### Authorization (Check User Tier)

```javascript
async function requireTier(minTier) {
  return async (req, res, next) => {
    const uid = req.user.uid;

    try {
      const subscriptionsSnapshot = await admin
        .firestore()
        .collection('customers')
        .doc(uid)
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();

      if (subscriptionsSnapshot.empty) {
        return res.status(403).json({ error: 'Subscription required' });
      }

      const subscription = subscriptionsSnapshot.docs[0].data();
      const tierHierarchy = { Free: 0, Basic: 1, Pro: 2, Enterprise: 3 };

      if (tierHierarchy[subscription.tier] < tierHierarchy[minTier]) {
        return res.status(403).json({
          error: `${minTier} tier required`,
          currentTier: subscription.tier
        });
      }

      next();
    } catch (error) {
      console.error('Error checking tier:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Usage
app.get('/api/premium-feature', authenticateUser, requireTier('Pro'), (req, res) => {
  res.json({ message: 'Premium feature accessed!' });
});
```

---

## Webhook Security

### Stripe Webhook Signature Verification

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful checkout
      break;
    case 'customer.subscription.updated':
      // Handle subscription update
      break;
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
```

### Webhook IP Whitelisting

```javascript
const STRIPE_WEBHOOK_IPS = [
  '3.18.12.63',
  '3.130.192.231',
  '13.235.14.237',
  // Add all Stripe webhook IPs
  // https://stripe.com/docs/ips
];

function verifyWebhookIP(req, res, next) {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!STRIPE_WEBHOOK_IPS.includes(clientIP)) {
    console.warn('Webhook request from unauthorized IP:', clientIP);
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

app.post('/webhooks/stripe', verifyWebhookIP, stripeWebhookHandler);
```

---

## Error Handling

### Secure Error Responses

```javascript
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Don't leak internal error details in production
  const isDev = process.env.NODE_ENV === 'development';

  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry or other monitoring service
    // Sentry.captureException(err);
  }

  // Send appropriate response
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      ...(isDev && { details: err.message }),
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}

app.use(errorHandler);
```

### Try-Catch Wrapper for Async Routes

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

---

## Security Checklist

### Before Deployment

- [ ] Enable CORS with whitelist of allowed origins
- [ ] Implement rate limiting on all endpoints
- [ ] Verify Firebase ID tokens on protected routes
- [ ] Validate and sanitize all user input
- [ ] Verify webhook signatures
- [ ] Set up proper error handling
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Implement logging and monitoring
- [ ] Set up alerts for suspicious activity
- [ ] Test with security scanning tools
- [ ] Review Firebase Security Rules
- [ ] Enable Firebase App Check (bot protection)
- [ ] Set up Sentry or error tracking
- [ ] Configure firewall rules if using compute instances
- [ ] Rotate API keys and secrets regularly

### Monitoring

- [ ] Set up alerts for failed authentication attempts
- [ ] Monitor rate limit violations
- [ ] Track unusual patterns in API usage
- [ ] Monitor webhook failures
- [ ] Set up uptime monitoring
- [ ] Configure error rate alerts
- [ ] Review security logs regularly

---

## Environment Variables

Required environment variables for security:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Security
CORS_ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
SESSION_SECRET=generate-random-secret
ENCRYPTION_KEY=generate-random-key

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/signatures)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
