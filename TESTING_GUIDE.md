# Testing Guide for RETVM SaaS Application

This guide covers testing strategies for your subscription-based real estate application.

## Table of Contents
1. [Setup](#setup)
2. [What to Test](#what-to-test)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Critical Test Cases](#critical-test-cases)

---

## Setup

### Install Testing Dependencies

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration Files

#### 1. Create `vitest.config.js` in frontend directory:

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 2. Create `src/tests/setup.js`:

```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

#### 3. Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

## What to Test

### 🔐 Authentication & Authorization (CRITICAL)

**Why:** Broken auth = security breach and angry users

**Test:**
- User can register with email/password
- User can log in with email/password
- User can sign in with Google
- Magic link authentication works
- Email verification flow
- Logout clears session
- Protected routes redirect unauthenticated users
- Tier-based access control works

### 💳 Subscription & Payment Flow (CRITICAL)

**Why:** Broken payments = no revenue

**Test:**
- Pricing plans display correctly
- Checkout flow redirects to Stripe
- Subscription status updates after payment
- Billing portal opens correctly
- Plan upgrades work
- Plan downgrades work
- Free tier limits are enforced
- Trial period logic works
- Canceled subscriptions lose access

### 🏠 Property Management (CORE FEATURE)

**Why:** This is your main product

**Test:**
- Users can create properties (up to tier limit)
- Property data saves to Firestore
- Income calculations are accurate
- Section totals calculate correctly
- Data persists across page reloads
- Delete property works
- Property limit enforced for free tier (5 properties)

### 🎨 UI Components

**Why:** Broken UI = bad UX

**Test:**
- Forms validate input correctly
- Buttons have proper disabled states
- Modals open and close
- Error messages display
- Loading states show during async operations

### 🔧 Utilities & Business Logic

**Why:** Wrong math = wrong decisions for users

**Test:**
- Income calculations
- Financing calculations
- Date formatting
- Number formatting
- Validation schemas

---

## Test Structure

### Recommended Directory Structure

```
frontend/
├── src/
│   ├── tests/
│   │   ├── setup.js                    # Test setup
│   │   ├── mocks/
│   │   │   ├── firebase.js             # Mock Firebase
│   │   │   ├── stripe.js               # Mock Stripe
│   │   │   └── handlers.js             # MSW handlers
│   │   ├── utils/
│   │   │   ├── renderWithProviders.jsx # Test helper
│   │   │   └── testData.js             # Mock data
│   │   └── integration/                # Integration tests
│   │       ├── auth.test.jsx
│   │       ├── subscription.test.jsx
│   │       └── propertyFlow.test.jsx
│   ├── components/
│   │   └── ComponentName/
│   │       ├── ComponentName.jsx
│   │       └── ComponentName.test.jsx  # Unit tests
│   ├── hooks/
│   │   └── useHookName.test.js
│   └── utils/
│       └── utilName.test.js
```

---

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run all tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- Login.test.jsx

# Run tests matching pattern
npm test -- --grep="subscription"
```

---

## Critical Test Cases

### 1. Authentication Tests

#### `src/features/auth/Auth/__tests__/Login.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';

describe('Login Component', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show error for invalid credentials', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByPlaceholderText(/email/i), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('should have Google sign-in button', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });
});
```

### 2. Subscription Tests

#### `src/tests/integration/subscription.test.jsx`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pricing from '@/components/Pricing/Pricing';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { SubscriptionProvider } from '@/app/providers/SubscriptionProvider';

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
};

describe('Subscription Flow', () => {
  beforeEach(() => {
    // Mock Stripe checkout
    vi.mock('@/utils/stripeService', () => ({
      startCheckout: vi.fn(() => Promise.resolve()),
      openBillingPortal: vi.fn(() => Promise.resolve()),
      PRICE_IDS: {
        Marketing: 'price_marketing',
        Developer: 'price_developer',
        Syndicator: 'price_syndicator',
      },
    }));
  });

  it('should display all pricing plans', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <Pricing />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/marketing plan/i)).toBeInTheDocument();
    expect(screen.getByText(/developer plan/i)).toBeInTheDocument();
    expect(screen.getByText(/syndicator plan/i)).toBeInTheDocument();
  });

  it('should show "Login to Subscribe" when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <Pricing />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const subscribeButtons = screen.getAllByText(/login to subscribe/i);
    expect(subscribeButtons.length).toBeGreaterThan(0);
  });

  it('should enforce property limit for free tier', async () => {
    // Mock user with free tier
    const { startCheckout } = await import('@/utils/stripeService');

    // Test that creating 6th property triggers upgrade prompt
    // This would be in your property creation component
  });
});
```

### 3. Property Limit Test

#### `src/tests/integration/propertyLimit.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';

describe('Property Limits', () => {
  it('should allow free users to create up to 5 properties', async () => {
    // Mock free tier user
    const freeTierUser = {
      uid: 'free-user',
      tier: 'free',
    };

    // Test creating 5 properties succeeds
    // Test creating 6th property shows upgrade prompt
  });

  it('should not limit paid tier users', async () => {
    const paidUser = {
      uid: 'paid-user',
      tier: 'marketing',
    };

    // Test can create unlimited properties
  });
});
```

### 4. Income Calculation Tests

#### `src/utils/income/__tests__/incomeMath.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { calculateNOI, calculateCapRate } from '../incomeMath';

describe('Income Calculations', () => {
  it('should calculate NOI correctly', () => {
    const income = 120000;
    const expenses = 40000;
    const noi = calculateNOI(income, expenses);

    expect(noi).toBe(80000);
  });

  it('should calculate cap rate correctly', () => {
    const noi = 80000;
    const purchasePrice = 1000000;
    const capRate = calculateCapRate(noi, purchasePrice);

    expect(capRate).toBe(8); // 8%
  });

  it('should handle division by zero gracefully', () => {
    const noi = 80000;
    const purchasePrice = 0;
    const capRate = calculateCapRate(noi, purchasePrice);

    expect(capRate).toBe(0);
  });
});
```

### 5. Form Validation Tests

#### `src/components/PropertyForm/__tests__/PropertyForm.test.jsx`

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyForm from '../PropertyForm';

describe('Property Form Validation', () => {
  it('should show error for invalid email', async () => {
    const user = userEvent.setup();
    render(<PropertyForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('should require all required fields', async () => {
    const user = userEvent.setup();
    render(<PropertyForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

---

## Test Helpers

### `src/tests/utils/renderWithProviders.jsx`

```javascript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { SubscriptionProvider } from '@/app/providers/SubscriptionProvider';

export function renderWithProviders(ui, options = {}) {
  const { route = '/' } = options;

  window.history.pushState({}, 'Test page', route);

  return render(
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          {ui}
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>,
    options
  );
}
```

### `src/tests/mocks/firebase.js`

```javascript
import { vi } from 'vitest';

export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
};

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
};
```

---

## Testing Checklist

### Before Every Release

- [ ] All auth flows work (email, Google, magic link)
- [ ] Users can subscribe to each plan
- [ ] Stripe checkout redirects properly
- [ ] Subscription status syncs with Firestore
- [ ] Property limits enforced correctly
- [ ] Income calculations are accurate
- [ ] All forms validate properly
- [ ] Protected routes work
- [ ] Logout clears all data
- [ ] Error states display properly
- [ ] Loading states show during async operations

### Monthly Regression Tests

- [ ] Test full user registration → subscription → property creation flow
- [ ] Test plan upgrade/downgrade
- [ ] Test subscription cancellation
- [ ] Verify Stripe webhook integration
- [ ] Check trial period expiration

---

## Best Practices

1. **Test User Behavior, Not Implementation**
   - ✅ Good: "User can click subscribe button and see checkout"
   - ❌ Bad: "startCheckout function is called with correct params"

2. **Use Real User Interactions**
   ```javascript
   // ✅ Good
   await user.click(screen.getByRole('button', { name: /subscribe/i }));

   // ❌ Bad
   fireEvent.click(getByTestId('subscribe-btn'));
   ```

3. **Test Critical Paths First**
   - Auth > Subscription > Core Features > UI Polish

4. **Mock External Services**
   - Always mock Firebase in tests
   - Always mock Stripe in tests
   - Use MSW for API mocking

5. **Keep Tests Fast**
   - Use unit tests for logic
   - Use integration tests for flows
   - Use E2E sparingly (Playwright/Cypress)

---

## Continuous Integration

### GitHub Actions Example (`.github/workflows/test.yml`)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run tests
        run: cd frontend && npm run test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
```

---

## Next Steps

1. **Install dependencies** (`npm install -D vitest @testing-library/react ...`)
2. **Create config files** (vitest.config.js, setup.js)
3. **Write your first test** (Login.test.jsx)
4. **Run tests** (`npm test`)
5. **Add more tests** incrementally
6. **Set up CI/CD** to run tests on every commit

---

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Firebase Testing](https://firebase.google.com/docs/rules/unit-tests)
