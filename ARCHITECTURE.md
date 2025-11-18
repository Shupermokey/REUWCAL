# System Architecture

This document provides a comprehensive overview of the REUWCAL application architecture, including system design, data flow, technology stack, and component structure.

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [Payment Flow](#payment-flow)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Performance Optimizations](#performance-optimizations)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

REUWCAL is a real estate underwriting calculator SaaS application that helps users analyze property investments through income statement modeling and financial calculations.

### Key Features
- Multi-property portfolio management
- Dynamic income statement builder
- Baseline scenario comparison
- Subscription-based access tiers
- Real-time data synchronization
- Secure file storage
- Stripe payment integration

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.21 | Build tool and dev server |
| React Router | 7.1.1 | Client-side routing |
| TanStack Query | 5.90.8 | Data fetching and caching |
| DnD Kit | 6.3.1 | Drag-and-drop functionality |
| React Hot Toast | 2.4.1 | Notifications |
| React Modal | 3.16.1 | Modal dialogs |
| Sentry | 8.46.0 | Error tracking |
| Web Vitals | 4.2.4 | Performance monitoring |

### Backend Services
| Service | Purpose |
|---------|---------|
| Firebase Authentication | User authentication |
| Cloud Firestore | Database |
| Firebase Storage | File storage |
| Firebase Hosting | Static hosting |
| Firebase Analytics | User analytics |
| Stripe | Payment processing |

### Development Tools
| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| React Testing Library | Component testing |
| ESLint | Code linting |
| Husky | Git hooks |
| lint-staged | Pre-commit checks |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  React App   │  │ TanStack     │  │  Sentry/         │  │
│  │  (Vite)      │  │ Query Cache  │  │  Analytics       │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬────────┘  │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          │                  │                    │
┌─────────┼──────────────────┼────────────────────┼───────────┐
│         │                  │                    │            │
│  ┌──────▼───────┐  ┌───────▼────────┐  ┌───────▼────────┐  │
│  │  Firebase    │  │  Cloud         │  │  Firebase      │  │
│  │  Auth        │  │  Firestore     │  │  Storage       │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Stripe API  │  │  Sentry API    │  │  Analytics API │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
│                                                              │
│                    Firebase Services                         │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Request** → React App
2. **State Management** → Context API + TanStack Query
3. **Data Layer** → Firebase SDK / Stripe SDK
4. **Backend Services** → Firebase / Stripe
5. **Response** → Update UI via state management
6. **Monitoring** → Sentry (errors) + Analytics (events)

---

## Data Model

### Firestore Collections

```
/users/{userId}
├── metadata
│   ├── email: string
│   ├── displayName: string
│   ├── createdAt: timestamp
│   └── photoURL: string
│
├── /properties/{propertyId}
│   ├── name: string
│   ├── address: string
│   ├── grossBuildingAreaSqFt: number
│   ├── units: number
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   ├── /rows/{rowId}
│   │   ├── label: string
│   │   ├── type: string
│   │   ├── order: number
│   │   ├── values: object
│   │   ├── createdAt: timestamp
│   │   │
│   │   └── /scenarios/{scenarioId}
│   │       ├── name: string
│   │       ├── values: object
│   │       └── createdAt: timestamp
│   │
│   ├── /fileSystem/{fileId}
│   │   ├── type: 'folder' | 'file'
│   │   ├── title: string
│   │   ├── createdAt: timestamp
│   │   │
│   │   └── /folders/{folderId}
│   │       └── (recursive structure)
│   │
│   └── /incomeStatement/{statementId}
│       ├── Income: object
│       ├── Expenses: object
│       ├── NOI: number
│       ├── updatedAt: timestamp
│       └── metadata: object
│
└── /baselines/{baselineId}
    ├── name: string
    ├── data: object
    ├── createdAt: timestamp
    └── updatedAt: timestamp

/customers/{userId}
├── email: string
├── stripeCustomerId: string
│
├── /checkout_sessions/{sessionId}
│   ├── price: string
│   ├── success_url: string
│   ├── cancel_url: string
│   ├── created: timestamp
│   └── sessionId: string (populated by webhook)
│
├── /subscriptions/{subscriptionId}
│   ├── status: 'active' | 'canceled' | 'past_due'
│   ├── tier: 'Free' | 'Basic' | 'Pro' | 'Enterprise'
│   ├── current_period_start: timestamp
│   ├── current_period_end: timestamp
│   ├── cancel_at_period_end: boolean
│   └── items: array
│
└── /payments/{paymentId}
    ├── amount: number
    ├── currency: string
    ├── status: string
    ├── created: timestamp
    └── invoice_pdf: string

/products/{productId}
├── name: string
├── description: string
├── active: boolean
├── role: string
│
└── /prices/{priceId}
    ├── active: boolean
    ├── currency: string
    ├── interval: 'month' | 'year'
    ├── unit_amount: number
    └── type: 'recurring' | 'one_time'
```

### Storage Structure

```
/users/{userId}/
├── profile/
│   └── avatar.jpg
│
├── properties/{propertyId}/
│   ├── images/
│   │   ├── exterior.jpg
│   │   ├── interior-*.jpg
│   │   └── floorplan.pdf
│   │
│   └── documents/
│       ├── lease-agreements/
│       ├── inspection-reports/
│       └── financial-statements/
│
└── incomeStatements/{statementId}/
    └── attachments/

/public/
├── logo.png
├── favicon.ico
└── static-assets/
```

---

## Component Architecture

### Directory Structure

```
frontend/src/
├── app/                          # App-level configuration
│   ├── providers/                # Context providers
│   │   ├── AppProvider.jsx       # Main app state
│   │   ├── AuthProvider.jsx      # Authentication state
│   │   ├── TableProvider.jsx     # Table/row state
│   │   ├── DialogProvider.jsx    # Dialog state
│   │   ├── IncomeViewProvider.jsx # Income view state
│   │   └── SubscriptionProvider.jsx # Subscription state
│   │
│   └── routes/                   # Route configuration
│       └── index.jsx
│
├── components/                   # React components
│   ├── Income/                   # Income statement components
│   │   ├── IncomeStatement.jsx   # Main container
│   │   ├── Section/              # Section components
│   │   │   ├── Section.jsx
│   │   │   ├── SectionHeader.jsx
│   │   │   ├── ValueColumns.jsx
│   │   │   └── TableRow.jsx
│   │   └── dialogs/              # Income dialogs
│   │
│   ├── Layout/                   # Layout components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   │
│   ├── Auth/                     # Authentication components
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   └── ErrorBoundary.jsx         # Error handling
│
├── pages/                        # Page components
│   ├── Home.jsx                  # Dashboard
│   ├── LoginPage.jsx             # Login
│   ├── RegisterPage.jsx          # Registration
│   ├── PricingPage.jsx           # Pricing plans
│   ├── ProfilePage.jsx           # User profile
│   ├── BaselinePage.jsx          # Baseline management
│   └── DeveloperTools.jsx        # Dev tools
│
├── services/                     # API/Service layer
│   ├── firebaseConfig.js         # Firebase configuration
│   ├── authService.js            # Authentication
│   ├── firestoreService.js       # Database operations
│   ├── firestore/                # Modular Firestore services
│   │   ├── rowsService.js
│   │   ├── propertiesService.js
│   │   └── baselinesService.js
│   └── stripeService.js          # Stripe integration
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.jsx               # Authentication hook
│   ├── useTier.jsx               # Subscription tier hook
│   ├── useIncomeStatement.jsx    # Income statement hook
│   └── useProperties.jsx         # Properties hook
│
├── config/                       # Configuration files
│   ├── queryClient.js            # React Query config
│   ├── sentry.js                 # Error tracking
│   ├── analytics.js              # Analytics config
│   └── security.js               # Security config
│
├── utils/                        # Utility functions
│   ├── tryCatchToast.js          # Error handling
│   ├── webVitals.js              # Performance monitoring
│   └── validation.js             # Input validation
│
├── constants/                    # Constants and config
│   ├── tiers.js                  # Subscription tiers
│   └── config.js                 # App configuration
│
└── styles/                       # Global styles
    ├── index.css                 # Global CSS
    └── variables.css             # CSS variables
```

### Component Hierarchy

```
App
├── ErrorBoundary
│   └── QueryClientProvider
│       └── AuthProvider
│           └── AppProvider
│               └── SubscriptionProvider
│                   └── TableProvider
│                       └── DialogProvider
│                           └── IncomeViewProvider
│                               └── Router
│                                   ├── ProtectedRoute
│                                   │   ├── Home (Dashboard)
│                                   │   ├── BaselinePage
│                                   │   ├── ProfilePage
│                                   │   └── DeveloperTools
│                                   │
│                                   └── Public Routes
│                                       ├── LoginPage
│                                       ├── RegisterPage
│                                       ├── PricingPage
│                                       └── VerifyEmail
```

---

## State Management

### Context Providers

**1. AuthProvider**
- Current user authentication state
- User metadata
- Loading states
- Sign in/out methods

```javascript
{
  currentUser: User | null,
  loading: boolean,
  error: Error | null
}
```

**2. AppProvider**
- Global application state
- Properties list
- Selected property
- UI state

```javascript
{
  properties: Property[],
  selectedProperty: Property | null,
  loading: boolean,
  updateProperty: (id, data) => void,
  deleteProperty: (id) => void
}
```

**3. TableProvider**
- Income statement rows
- Row operations (CRUD)
- Drag-and-drop state

```javascript
{
  rows: Row[],
  addRow: (data) => void,
  updateRow: (id, data) => void,
  deleteRow: (id) => void,
  reorderRows: (result) => void
}
```

**4. SubscriptionProvider**
- User subscription status
- Current tier
- Subscription metadata

```javascript
{
  subscription: Subscription | null,
  tier: Tier,
  loading: boolean,
  isActive: boolean
}
```

**5. IncomeViewProvider**
- Income statement view state
- Selected sections
- Calculation results

```javascript
{
  selectedView: 'monthly' | 'annual',
  sections: Section[],
  totals: Totals,
  updateView: (view) => void
}
```

### TanStack Query Cache

```javascript
// Query keys structure
queryKey: ['properties', userId]
queryKey: ['property', propertyId]
queryKey: ['incomeStatement', userId, propertyId]
queryKey: ['baselines', userId]
queryKey: ['subscription', userId]
```

**Cache Configuration:**
- Stale time: 5 minutes
- Cache time: 10 minutes
- Retry: 3 attempts with exponential backoff
- Refetch on window focus: Production only

---

## Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Login/Register │
│  Form           │
└────┬────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Firebase Authentication     │
│  - Email/Password            │
│  - Google OAuth              │
│  - Magic Link (future)       │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│  onAuthStateChanged         │
│  Listener                   │
└────┬─────────────────────────┘
     │
     ├─── User Found ──────────┐
     │                         │
     │                         ▼
     │              ┌─────────────────────┐
     │              │  Load User Metadata │
     │              │  from Firestore     │
     │              └────┬────────────────┘
     │                   │
     │                   ▼
     │              ┌─────────────────────┐
     │              │  Load Subscription  │
     │              │  Data               │
     │              └────┬────────────────┘
     │                   │
     │                   ▼
     │              ┌─────────────────────┐
     │              │  Update AuthContext │
     │              │  & SubscriptionContext│
     │              └────┬────────────────┘
     │                   │
     │                   ▼
     │              ┌─────────────────────┐
     │              │  Redirect to        │
     │              │  Dashboard          │
     │              └─────────────────────┘
     │
     └─── No User ─────────────┐
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Redirect to Login  │
                     └─────────────────────┘
```

### Protected Routes

```javascript
<ProtectedRoute minTier="Pro">
  <PremiumFeature />
</ProtectedRoute>
```

**Tier Hierarchy:**
- Free (0)
- Basic (1)
- Pro (2)
- Enterprise (3)

---

## Payment Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     ▼
┌─────────────────────┐
│  Pricing Page       │
│  Select Plan        │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Create Checkout Session        │
│  stripeService.createCheckout() │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Write to Firestore:            │
│  /customers/{uid}/              │
│  checkout_sessions/{id}         │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Firestore Trigger              │
│  (Stripe Extension)             │
│  Creates Stripe Session         │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Redirect to Stripe Checkout    │
└────┬────────────────────────────┘
     │
     ├─── Success ──────────────┐
     │                          │
     │                          ▼
     │               ┌──────────────────────┐
     │               │  Stripe Webhook      │
     │               │  Updates Firestore   │
     │               └────┬─────────────────┘
     │                    │
     │                    ▼
     │               ┌──────────────────────┐
     │               │  Subscription Active │
     │               │  in Firestore        │
     │               └────┬─────────────────┘
     │                    │
     │                    ▼
     │               ┌──────────────────────┐
     │               │  App Detects Change  │
     │               │  via Realtime Listen │
     │               └────┬─────────────────┘
     │                    │
     │                    ▼
     │               ┌──────────────────────┐
     │               │  Update UI           │
     │               │  Grant Access        │
     │               └──────────────────────┘
     │
     └─── Cancel ──────────────┐
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Return to Pricing  │
                     └─────────────────────┘
```

---

## Data Flow

### Creating a Property

```
User Action (UI)
     │
     ▼
addProperty(data)  ← AppProvider
     │
     ▼
Validation  ← src/utils/validation.js
     │
     ▼
Rate Limit Check  ← src/config/security.js
     │
     ▼
Firestore Write  ← src/services/firestoreService.js
     │
     ├─── Collection: /users/{uid}/properties
     │    ├── name
     │    ├── address
     │    ├── grossBuildingAreaSqFt
     │    ├── units
     │    ├── createdAt (serverTimestamp)
     │    └── updatedAt (serverTimestamp)
     │
     ▼
TanStack Query Invalidation
     │
     ▼
Refetch Properties List
     │
     ▼
Update UI
     │
     ▼
Analytics Tracking  ← src/config/analytics.js
     │
     └─→ Event: 'create_property'
```

### Saving Income Statement

```
User Edits Row
     │
     ▼
updateRow(id, data)  ← TableProvider
     │
     ▼
Debounce (500ms)  ← Performance optimization
     │
     ▼
Validation  ← validateRowData()
     │
     ▼
Local State Update  ← Optimistic update
     │
     ▼
Firestore Write  ← saveRowData()
     │
     ├─── Path: /users/{uid}/properties/{pid}/rows/{rid}
     │
     ├─── Success ────┐
     │                │
     │                ▼
     │           Sync Complete
     │                │
     │                ▼
     │           Toast Success
     │
     └─── Error ─────┐
                     │
                     ▼
                Rollback State
                     │
                     ▼
                Toast Error
                     │
                     ▼
                Sentry.captureException()
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Client-Side**
- Input validation (`src/utils/validation.js`)
- XSS prevention (sanitization)
- Rate limiting (`src/config/security.js`)
- Session timeout (15 minutes)
- CSP headers

**Layer 2: Firebase Security Rules**
- Authentication required
- Ownership validation
- Field validation
- Rate limiting
- Timestamp validation

**Layer 3: Backend Services**
- Firebase Admin SDK (server-side)
- Stripe webhook signatures
- CORS restrictions
- Request validation

**Layer 4: Infrastructure**
- HTTPS only
- Security headers
- DDoS protection (Firebase)
- Automatic scaling

### Security Rules Example

```javascript
// Firestore rule
match /users/{userId}/properties/{propertyId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId
    && request.resource.data.createdAt == request.time
    && request.resource.data.updatedAt == request.time;
  allow update: if request.auth.uid == userId
    && request.resource.data.updatedAt == request.time;
  allow delete: if request.auth.uid == userId;
}
```

---

## Performance Optimizations

### 1. Code Splitting
- Route-based lazy loading
- Manual chunks (React, Firebase, Stripe)
- Dynamic imports

### 2. React Optimizations
- `React.memo` for expensive components
- `useMemo` for expensive calculations
- `useCallback` for event handlers
- Virtualization (future: for long lists)

### 3. Caching Strategy
- TanStack Query cache (5-10 min)
- Service Worker (future: PWA)
- CDN caching (Firebase Hosting)
- Browser caching (static assets: 1 year)

### 4. Bundle Optimization
- Tree shaking
- Minification (Terser)
- Compression (gzip/brotli)
- Remove console.logs in production

### 5. Database Optimization
- Firestore indexes
- Denormalization where needed
- Batch operations
- Realtime listeners (selective)

### Bundle Analysis
- Total gzipped: ~300 KB
- React vendor: 57 KB
- Firebase: 114 KB
- Main app: 108 KB
- Route chunks: < 3 KB each

---

## Deployment Architecture

### Development Environment

```
Local Development
     │
     ├─→ Vite Dev Server (localhost:5173)
     ├─→ Firebase Emulators
     │   ├── Auth (port 9099)
     │   ├── Firestore (port 8080)
     │   ├── Storage (port 9199)
     │   └── Hosting (port 5000)
     │
     └─→ Stripe Test Mode
```

### Staging Environment

```
GitHub Push (develop branch)
     │
     ▼
GitHub Actions Workflow
     │
     ├─→ Lint & Test
     ├─→ Build
     ├─→ Security Scan
     │
     ▼
Deploy to Firebase Hosting (staging)
     │
     ├─→ Staging URL: staging.yourapp.com
     ├─→ Firestore (staging project)
     ├─→ Firebase Auth (staging)
     ├─→ Stripe Test Mode
     │
     ▼
Smoke Tests
     │
     ▼
Notifications (Slack/Discord)
```

### Production Environment

```
GitHub Release (main branch)
     │
     ▼
Manual Approval Required
     │
     ▼
GitHub Actions Workflow
     │
     ├─→ All Checks (lint, test, build)
     ├─→ Security Audit
     ├─→ Performance Audit
     │
     ▼
Deploy to Firebase Hosting (production)
     │
     ├─→ Production URL: yourapp.com
     ├─→ Firestore (production project)
     ├─→ Firebase Auth (production)
     ├─→ Stripe Live Mode
     │
     ▼
Sentry Release Tracking
     │
     ▼
Post-Deployment Tests
     │
     ▼
Notifications
     │
     └─→ Rollback if needed
```

### CDN & Hosting

**Firebase Hosting Features:**
- Global CDN
- SSL certificates (auto-renewed)
- Custom domains
- Automatic compression (gzip/brotli)
- Cache control headers
- Rollback capability
- Preview channels

---

## Monitoring & Observability

### Error Tracking (Sentry)
- JavaScript errors
- React error boundaries
- Performance monitoring
- Session replay
- User context
- Breadcrumbs

### Analytics (Firebase Analytics)
- User behavior tracking
- Conversion funnels
- Custom events
- User properties
- Screen views
- Engagement metrics

### Performance (Web Vitals)
- CLS (Cumulative Layout Shift)
- INP (Interaction to Next Paint)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTFB (Time to First Byte)

### Custom Monitoring
- Security event logging
- Rate limit violations
- Failed authentications
- Subscription events
- Payment events

---

## Future Enhancements

### Planned Features
- [ ] Progressive Web App (PWA)
- [ ] Offline support with Service Workers
- [ ] Real-time collaboration
- [ ] Export to Excel/PDF
- [ ] Advanced charting/visualization
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Multi-language support (i18n)

### Technical Improvements
- [ ] Implement Redis caching
- [ ] GraphQL API layer
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] A/B testing framework
- [ ] Feature flags system
- [ ] Advanced monitoring dashboards

---

## References

- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Stripe Documentation](https://stripe.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Maintained By:** Development Team
