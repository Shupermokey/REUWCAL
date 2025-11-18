# API Documentation

This document provides comprehensive API documentation for the REUWCAL application, including authentication, data models, service methods, and integration guides.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Services](#services)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)

---

## Overview

REUWCAL uses Firebase services for backend functionality. All API interactions are handled through Firebase SDKs and custom service layers.

### Base Configuration

```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
```

---

## Authentication

### Auth Service
**File:** `src/services/authService.js`

### Methods

#### `registerUser(email, password, displayName)`
Register a new user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password (min 8 characters)
- `displayName` (string, optional): User's display name

**Returns:** `Promise<UserCredential>`

**Example:**
```javascript
import { registerUser } from '@/services/authService';

try {
  const user = await registerUser(
    'user@example.com',
    'SecurePass123!',
    'John Doe'
  );
  console.log('User registered:', user.uid);
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

**Errors:**
- `auth/email-already-in-use`: Email is already registered
- `auth/invalid-email`: Invalid email format
- `auth/weak-password`: Password doesn't meet requirements

---

#### `loginUser(email, password)`
Sign in an existing user.

**Parameters:**
- `email` (string): User's email
- `password` (string): User's password

**Returns:** `Promise<UserCredential>`

**Example:**
```javascript
import { loginUser } from '@/services/authService';

const user = await loginUser('user@example.com', 'password123');
```

**Errors:**
- `auth/user-not-found`: No user with this email
- `auth/wrong-password`: Incorrect password
- `auth/too-many-requests`: Rate limit exceeded

---

#### `logoutUser()`
Sign out the current user.

**Returns:** `Promise<void>`

**Example:**
```javascript
import { logoutUser } from '@/services/authService';

await logoutUser();
```

---

#### `handleSignInWithGoogle()`
Sign in with Google OAuth.

**Returns:** `Promise<UserCredential>`

**Example:**
```javascript
import { handleSignInWithGoogle } from '@/services/authService';

const user = await handleSignInWithGoogle();
```

---

### Auth Hooks

#### `useAuth()`
React hook for accessing authentication state.

**Returns:**
```typescript
{
  currentUser: User | null,
  loading: boolean,
  error: Error | null
}
```

**Example:**
```javascript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loading />;
  if (!currentUser) return <LoginPrompt />;

  return <div>Welcome, {currentUser.email}</div>;
}
```

---

## Services

### Firestore Service
**File:** `src/services/firestoreService.js`

---

### Property Methods

#### `getProperties(userId)`
Fetch all properties for a user.

**Parameters:**
- `userId` (string): User's Firebase UID

**Returns:** `Promise<Property[]>`

**Example:**
```javascript
import { getProperties } from '@/services/firestoreService';

const properties = await getProperties(user.uid);
```

---

#### `addProperty(userId, data)`
Create a new property.

**Parameters:**
- `userId` (string): User's Firebase UID
- `data` (object): Property data

**Data Schema:**
```typescript
{
  name: string,              // Required, 1-200 chars
  address?: string,          // Optional, max 500 chars
  grossBuildingAreaSqFt?: number,  // Optional, 0-10,000,000
  units?: number,            // Optional, 0-10,000
  // Auto-generated:
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Returns:** `Promise<string>` (Property ID)

**Example:**
```javascript
import { addProperty } from '@/services/firestoreService';

const propertyId = await addProperty(user.uid, {
  name: 'Sunset Apartments',
  address: '123 Main St, City, State 12345',
  grossBuildingAreaSqFt: 50000,
  units: 24
});
```

---

#### `updateProperty(userId, propertyId, data)`
Update an existing property.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID
- `data` (object): Updated property data

**Returns:** `Promise<void>`

**Example:**
```javascript
import { updateProperty } from '@/services/firestoreService';

await updateProperty(user.uid, propertyId, {
  name: 'Updated Property Name',
  units: 30
});
```

---

#### `deleteProperty(userId, propertyId)`
Delete a property.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID

**Returns:** `Promise<void>`

**Example:**
```javascript
import { deleteProperty } from '@/services/firestoreService';

await deleteProperty(user.uid, propertyId);
```

---

#### `subscribeToProperties(userId, callback, onError)`
Subscribe to real-time property updates.

**Parameters:**
- `userId` (string): User's Firebase UID
- `callback` (function): Called with updated properties array
- `onError` (function, optional): Error handler

**Returns:** `Unsubscribe` function

**Example:**
```javascript
import { subscribeToProperties } from '@/services/firestoreService';

const unsubscribe = subscribeToProperties(
  user.uid,
  (properties) => {
    console.log('Properties updated:', properties);
    setProperties(properties);
  },
  (error) => {
    console.error('Subscription error:', error);
  }
);

// Cleanup
return () => unsubscribe();
```

---

### Row Methods

#### `addRow(userId, propertyId, rowData)`
Add a new row to a property's income statement.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID
- `rowData` (object): Row data

**Row Data Schema:**
```typescript
{
  label: string,           // Required, 1-200 chars
  type?: string,           // 'income' | 'expense' | 'subtotal'
  category?: string,
  order?: number,
  values?: {
    monthly?: number,
    annual?: number,
    perUnit?: number,
    perSqFt?: number
  },
  // Auto-generated:
  createdAt: Timestamp
}
```

**Returns:** `Promise<string>` (Row ID)

**Example:**
```javascript
import { addRow } from '@/services/firestoreService';

const rowId = await addRow(user.uid, propertyId, {
  label: 'Rental Income',
  type: 'income',
  category: 'Revenue',
  values: {
    monthly: 50000,
    annual: 600000
  }
});
```

---

#### `getRowsByProperty(userId, propertyId)`
Fetch all rows for a property.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID

**Returns:** `Promise<Row[]>`

**Example:**
```javascript
import { getRowsByProperty } from '@/services/firestoreService';

const rows = await getRowsByProperty(user.uid, propertyId);
```

---

#### `updateRow(userId, propertyId, rowId, updates)`
Update a row.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID
- `rowId` (string): Row ID
- `updates` (object): Updated row data

**Returns:** `Promise<void>`

**Example:**
```javascript
import { updateRow } from '@/services/firestoreService';

await updateRow(user.uid, propertyId, rowId, {
  label: 'Updated Label',
  values: { monthly: 55000 }
});
```

---

#### `deleteRow(userId, propertyId, rowId)`
Delete a row.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID
- `rowId` (string): Row ID

**Returns:** `Promise<void>`

---

### Income Statement Methods

#### `getIncomeStatement(userId, propertyId)`
Fetch the income statement for a property.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID

**Returns:** `Promise<IncomeStatement | null>`

**Income Statement Schema:**
```typescript
{
  Income: {
    [category: string]: {
      [rowId: string]: {
        label: string,
        values: {
          monthly?: number,
          annual?: number,
          perUnit?: number,
          perSqFt?: number
        }
      }
    }
  },
  Expenses: {
    // Same structure as Income
  },
  NOI: number,               // Net Operating Income
  metadata: {
    lastUpdated: Timestamp,
    version: number
  }
}
```

**Example:**
```javascript
import { getIncomeStatement } from '@/services/firestoreService';

const statement = await getIncomeStatement(user.uid, propertyId);

if (statement) {
  console.log('NOI:', statement.NOI);
  console.log('Income categories:', Object.keys(statement.Income));
}
```

---

#### `saveIncomeStatement(userId, propertyId, data)`
Save or update income statement.

**Parameters:**
- `userId` (string): User's Firebase UID
- `propertyId` (string): Property ID
- `data` (object): Complete income statement data

**Returns:** `Promise<void>`

**Example:**
```javascript
import { saveIncomeStatement } from '@/services/firestoreService';

await saveIncomeStatement(user.uid, propertyId, {
  Income: { /* income data */ },
  Expenses: { /* expense data */ },
  NOI: 250000,
  metadata: {
    lastUpdated: new Date(),
    version: 2
  }
});
```

---

### Baseline Methods

#### `getBaselines(userId)`
Fetch all baselines for a user.

**Parameters:**
- `userId` (string): User's Firebase UID

**Returns:** `Promise<Baseline[]>`

**Baseline Schema:**
```typescript
{
  id: string,
  name: string,             // 1-200 chars
  data: object,             // Baseline data
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Example:**
```javascript
import { getBaselines } from '@/services/firestoreService';

const baselines = await getBaselines(user.uid);
```

---

#### `saveBaseline(userId, baselineId, baselineData)`
Save or update a baseline.

**Parameters:**
- `userId` (string): User's Firebase UID
- `baselineId` (string): Baseline ID (use custom ID or Firestore auto-ID)
- `baselineData` (object): Baseline data

**Returns:** `Promise<void>`

**Example:**
```javascript
import { saveBaseline } from '@/services/firestoreService';

await saveBaseline(user.uid, 'baseline-2024-Q1', {
  name: 'Q1 2024 Baseline',
  data: {
    propertyId: 'prop123',
    incomeStatement: { /* data */ }
  }
});
```

---

#### `deleteBaseline(userId, baselineId)`
Delete a baseline.

**Parameters:**
- `userId` (string): User's Firebase UID
- `baselineId` (string): Baseline ID

**Returns:** `Promise<void>`

---

#### `subscribeToBaselines(userId, callback, onError)`
Subscribe to real-time baseline updates.

**Parameters:**
- `userId` (string): User's Firebase UID
- `callback` (function): Called with updated baselines array
- `onError` (function, optional): Error handler

**Returns:** `Unsubscribe` function

**Example:**
```javascript
import { subscribeToBaselines } from '@/services/firestoreService';

const unsubscribe = subscribeToBaselines(
  user.uid,
  (baselines) => {
    setBaselines(baselines);
  }
);

// Cleanup
return () => unsubscribe();
```

---

### User Methods

#### `getUserMetadata(userId)`
Fetch user metadata.

**Parameters:**
- `userId` (string): User's Firebase UID

**Returns:** `Promise<UserMetadata | null>`

**User Metadata Schema:**
```typescript
{
  email: string,
  displayName?: string,
  photoURL?: string,
  createdAt: Timestamp,
  settings?: object
}
```

---

#### `getUserSubscriptions(userId)`
Fetch user's subscription data.

**Parameters:**
- `userId` (string): User's Firebase UID

**Returns:** `Promise<Subscription[]>`

**Subscription Schema:**
```typescript
{
  id: string,
  status: 'active' | 'canceled' | 'past_due' | 'trialing',
  tier: 'Free' | 'Basic' | 'Pro' | 'Enterprise',
  current_period_start: Timestamp,
  current_period_end: Timestamp,
  cancel_at_period_end: boolean,
  items: SubscriptionItem[]
}
```

**Example:**
```javascript
import { getUserSubscriptions } from '@/services/firestoreService';

const subscriptions = await getUserSubscriptions(user.uid);
const activeSubscription = subscriptions.find(sub => sub.status === 'active');
```

---

#### `createUserProfile(userId, data)`
Create or update user profile.

**Parameters:**
- `userId` (string): User's Firebase UID
- `data` (object): User profile data

**Returns:** `Promise<void>`

**Example:**
```javascript
import { createUserProfile } from '@/services/firestoreService';

await createUserProfile(user.uid, {
  displayName: 'John Doe',
  email: user.email,
  settings: {
    theme: 'dark',
    notifications: true
  }
});
```

---

### Stripe Service
**File:** `src/utils/stripeService.js`

#### `createCheckoutSession(priceId, userId, successUrl, cancelUrl)`
Create a Stripe checkout session.

**Parameters:**
- `priceId` (string): Stripe price ID
- `userId` (string): User's Firebase UID
- `successUrl` (string, optional): Success redirect URL
- `cancelUrl` (string, optional): Cancel redirect URL

**Returns:** `Promise<string>` (Checkout session URL)

**Example:**
```javascript
import { createCheckoutSession } from '@/utils/stripeService';

try {
  const checkoutUrl = await createCheckoutSession(
    'price_1234567890',
    user.uid,
    '/dashboard?success=true',
    '/pricing?canceled=true'
  );

  // Redirect to Stripe Checkout
  window.location.href = checkoutUrl;
} catch (error) {
  console.error('Checkout failed:', error);
}
```

---

#### `createPortalLink(returnUrl)`
Create a Stripe customer portal link.

**Parameters:**
- `returnUrl` (string, optional): Return URL after portal session

**Returns:** `Promise<string>` (Portal URL)

**Example:**
```javascript
import { createPortalLink } from '@/utils/stripeService';

const portalUrl = await createPortalLink('/profile');
window.location.href = portalUrl;
```

---

## Data Models

### TypeScript Definitions

```typescript
// User
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// Property
interface Property {
  id: string;
  name: string;
  address?: string;
  grossBuildingAreaSqFt?: number;
  units?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Row
interface Row {
  id: string;
  label: string;
  type?: 'income' | 'expense' | 'subtotal';
  category?: string;
  order?: number;
  values?: {
    monthly?: number;
    annual?: number;
    perUnit?: number;
    perSqFt?: number;
  };
  createdAt: Timestamp;
}

// Income Statement
interface IncomeStatement {
  Income: {
    [category: string]: {
      [rowId: string]: RowData;
    };
  };
  Expenses: {
    [category: string]: {
      [rowId: string]: RowData;
    };
  };
  NOI: number;
  metadata: {
    lastUpdated: Timestamp;
    version: number;
  };
}

// Baseline
interface Baseline {
  id: string;
  name: string;
  data: any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subscription
interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  tier: 'Free' | 'Basic' | 'Pro' | 'Enterprise';
  current_period_start: Timestamp;
  current_period_end: Timestamp;
  cancel_at_period_end: boolean;
  items: SubscriptionItem[];
}

interface SubscriptionItem {
  id: string;
  price: {
    id: string;
    product: string;
    unit_amount: number;
    currency: string;
  };
  quantity: number;
}
```

---

## Error Handling

### Standard Error Format

All service methods throw standard Firebase or custom errors:

```javascript
try {
  await someServiceMethod();
} catch (error) {
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);

  // Handle specific errors
  switch (error.code) {
    case 'permission-denied':
      // User doesn't have permission
      break;
    case 'not-found':
      // Document not found
      break;
    case 'unauthenticated':
      // User not authenticated
      break;
    default:
      // Generic error
  }
}
```

### Common Error Codes

#### Authentication Errors
- `auth/email-already-in-use`
- `auth/invalid-email`
- `auth/user-not-found`
- `auth/wrong-password`
- `auth/too-many-requests`
- `auth/weak-password`

#### Firestore Errors
- `permission-denied`: User lacks permission
- `not-found`: Document doesn't exist
- `already-exists`: Document already exists
- `resource-exhausted`: Rate limit exceeded
- `unauthenticated`: User not authenticated
- `invalid-argument`: Invalid data provided

#### Stripe Errors
- `stripe/invalid-price-id`
- `stripe/checkout-failed`
- `stripe/portal-failed`

---

## Rate Limiting

### Client-Side Rate Limits

```javascript
import {
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter
} from '@/config/security';

// Check if request is allowed
if (!authRateLimiter.isAllowed()) {
  const timeLeft = authRateLimiter.getTimeUntilReset();
  throw new Error(`Rate limit exceeded. Try again in ${timeLeft}ms`);
}

// Proceed with request
await loginUser(email, password);
```

### Rate Limit Thresholds
- **Authentication:** 10 attempts per 15 minutes
- **API Calls:** 100 requests per minute
- **File Uploads:** 10 uploads per 5 minutes

### Server-Side Rate Limits
Enforced by Firebase Security Rules (see `firestore.rules`).

---

## Code Examples

### Complete Property CRUD Example

```javascript
import {
  getProperties,
  addProperty,
  updateProperty,
  deleteProperty
} from '@/services/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { tryCatchToast } from '@/utils/tryCatchToast';

function PropertyManager() {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);

  // Fetch properties
  useEffect(() => {
    if (currentUser) {
      loadProperties();
    }
  }, [currentUser]);

  const loadProperties = async () => {
    const data = await tryCatchToast(
      getProperties(currentUser.uid),
      'Properties loaded',
      'Failed to load properties'
    );
    setProperties(data);
  };

  // Create property
  const handleCreate = async (propertyData) => {
    const id = await tryCatchToast(
      addProperty(currentUser.uid, propertyData),
      'Property created',
      'Failed to create property'
    );
    loadProperties(); // Refresh list
  };

  // Update property
  const handleUpdate = async (propertyId, updates) => {
    await tryCatchToast(
      updateProperty(currentUser.uid, propertyId, updates),
      'Property updated',
      'Failed to update property'
    );
    loadProperties();
  };

  // Delete property
  const handleDelete = async (propertyId) => {
    if (confirm('Are you sure?')) {
      await tryCatchToast(
        deleteProperty(currentUser.uid, propertyId),
        'Property deleted',
        'Failed to delete property'
      );
      loadProperties();
    }
  };

  return (
    <div>
      {/* Property list and forms */}
    </div>
  );
}
```

### Real-time Data Subscription

```javascript
import { subscribeToProperties } from '@/services/firestoreService';
import { useAuth } from '@/hooks/useAuth';

function RealTimePropertyList() {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToProperties(
      currentUser.uid,
      (updatedProperties) => {
        setProperties(updatedProperties);
      },
      (error) => {
        console.error('Subscription error:', error);
      }
    );

    // Cleanup on unmount
    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div>
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

### TanStack Query Integration

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperties, addProperty } from '@/services/firestoreService';
import { useAuth } from '@/hooks/useAuth';

function useProperties() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', currentUser?.uid],
    queryFn: () => getProperties(currentUser.uid),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create property mutation
  const createProperty = useMutation({
    mutationFn: (data) => addProperty(currentUser.uid, data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['properties', currentUser.uid]);
    },
  });

  return {
    properties,
    isLoading,
    createProperty: createProperty.mutate,
    isCreating: createProperty.isPending,
  };
}
```

---

## Webhooks

### Stripe Webhook Events

The application handles the following Stripe webhook events:

- `checkout.session.completed`: Checkout successful
- `customer.subscription.created`: New subscription
- `customer.subscription.updated`: Subscription changed
- `customer.subscription.deleted`: Subscription canceled
- `invoice.payment_succeeded`: Payment received
- `invoice.payment_failed`: Payment failed

**Note:** Webhooks are handled by Firebase Extensions for Stripe. See [Stripe Extension Documentation](https://firebase.google.com/products/extensions/firestore-stripe-payments).

---

## Best Practices

### 1. Always Use Error Handling

```javascript
import { tryCatchToast } from '@/utils/tryCatchToast';

// Good
const data = await tryCatchToast(
  fetchData(),
  'Success message',
  'Error message'
);

// Avoid
const data = await fetchData(); // No error handling
```

### 2. Validate Input Before API Calls

```javascript
import { validatePropertyData } from '@/utils/validation';

const { isValid, errors } = validatePropertyData(data);
if (!isValid) {
  console.error('Validation errors:', errors);
  return;
}

await addProperty(userId, data);
```

### 3. Use React Query for Data Fetching

```javascript
// Good: Automatic caching, refetching, error handling
const { data, isLoading, error } = useQuery({
  queryKey: ['properties', userId],
  queryFn: () => getProperties(userId),
});

// Avoid: Manual state management
const [data, setData] = useState(null);
useEffect(() => {
  getProperties(userId).then(setData);
}, [userId]);
```

### 4. Cleanup Subscriptions

```javascript
useEffect(() => {
  const unsubscribe = subscribeToProperties(userId, callback);

  // Always cleanup
  return () => unsubscribe();
}, [userId]);
```

### 5. Rate Limit Sensitive Operations

```javascript
import { authRateLimiter } from '@/config/security';

async function handleLogin(email, password) {
  if (!authRateLimiter.isAllowed()) {
    throw new Error('Too many attempts');
  }

  await loginUser(email, password);
}
```

---

## Testing APIs

### Unit Testing Example

```javascript
import { describe, it, expect, vi } from 'vitest';
import { addProperty } from '@/services/firestoreService';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('addProperty', () => {
  it('should create a property and return ID', async () => {
    const userId = 'user123';
    const data = { name: 'Test Property' };

    const id = await addProperty(userId, data);

    expect(id).toBe('mock-id');
  });
});
```

---

## Migration Guide

### Updating from Firebase v9 to v10

If you need to update Firebase SDK:

```bash
npm install firebase@latest
```

Update imports:
```javascript
// Old (v9)
import { getFirestore } from 'firebase/firestore';

// New (v10) - usually the same
import { getFirestore } from 'firebase/firestore';
```

Check [Firebase Release Notes](https://firebase.google.com/support/release-notes/js) for breaking changes.

---

## Support

For API issues or questions:
- Check error logs in browser console
- Review Sentry for server-side errors
- Check Firebase Console for quota/permissions issues
- Review this documentation
- Contact development team

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**API Version:** v1
