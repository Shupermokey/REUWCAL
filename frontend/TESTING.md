# Testing Guide

This document provides comprehensive information about testing in this project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [E2E Testing](#e2e-testing)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## Overview

Our testing strategy consists of three levels:

1. **Unit Tests** - Test individual functions, utilities, and hooks in isolation
2. **Integration Tests** - Test component interactions and feature flows
3. **End-to-End Tests** - Test complete user journeys in a real browser

### Tech Stack

- **Unit/Integration Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Coverage**: Vitest Coverage (v8)

---

## Test Structure

```
src/
├── utils/__tests__/           # Utility function tests
├── services/__tests__/        # Service layer tests
├── hooks/__tests__/           # Custom hook tests
├── components/__tests__/      # Component tests
├── features/__tests__/        # Feature module tests
└── tests/
    ├── setup.js              # Test configuration
    ├── mocks/                # Mock implementations
    │   ├── firebase.js
    │   └── stripe.js
    ├── utils/                # Test utilities
    │   ├── renderWithProviders.jsx
    │   └── testData.js
    └── integration/          # Integration tests
        ├── authFlow.test.jsx
        ├── protectedRoute.test.jsx
        └── pricing.test.jsx

e2e/                          # End-to-end tests
├── auth.spec.js
├── subscription.spec.js
└── dashboard.spec.js
```

---

## Running Tests

### Unit & Integration Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html  # macOS
start coverage/index.html  # Windows
```

### E2E Tests

```bash
# Install Playwright (first time only)
npm install -D @playwright/test
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui

# Run E2E in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.js
```

### Run All Tests

```bash
npm run test:all
```

---

## Writing Tests

### Unit Tests

**Example: Testing a Utility Function**

```javascript
// src/utils/__tests__/myUtil.test.js
import { describe, it, expect } from 'vitest';
import { myUtil } from '../myUtil';

describe('myUtil', () => {
  it('should return expected result', () => {
    const result = myUtil('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myUtil(null)).toBe(null);
    expect(myUtil('')).toBe('');
  });
});
```

**Example: Testing a Custom Hook**

```javascript
// src/hooks/__tests__/useMyHook.test.jsx
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should fetch and return data', async () => {
    const { result } = renderHook(() => useMyHook('id123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

**Example: Testing a Component**

```javascript
// src/components/__tests__/MyComponent.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Integration Tests

**Example: Testing a Flow**

```javascript
// src/tests/integration/myFlow.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../utils/renderWithProviders';
import { App } from '../../App';

describe('My Feature Flow', () => {
  it('should complete the full flow', async () => {
    renderWithProviders(<App />, {
      initialRoute: '/start',
    });

    // Step 1: Initial state
    expect(screen.getByText('Start')).toBeInTheDocument();

    // Step 2: User interaction
    fireEvent.click(screen.getByText('Next'));

    // Step 3: Wait for result
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

**Example: User Journey**

```javascript
// e2e/myJourney.spec.js
import { test, expect } from '@playwright/test';

test.describe('User Journey', () => {
  test('should complete checkout', async ({ page }) => {
    // Navigate
    await page.goto('/');

    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await expect(page).toHaveURL('/dashboard');

    // Select plan
    await page.goto('/pricing');
    await page.click('button:has-text("Subscribe")');

    // Verify redirect to checkout
    await expect(page).toHaveURL(/stripe.com/);
  });
});
```

---

## E2E Testing

### Configuration

Playwright is configured in `playwright.config.js`.

Key settings:
- **baseURL**: `http://localhost:5173` (development server)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Retries**: 2 on CI, 0 locally
- **Artifacts**: Screenshots and videos on failure

### Running Against Different Environments

```bash
# Development
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e

# Staging
PLAYWRIGHT_BASE_URL=https://staging.yourapp.com npm run test:e2e

# Production (use with caution!)
PLAYWRIGHT_BASE_URL=https://yourapp.com npm run test:e2e
```

### Authentication in E2E Tests

For tests requiring authentication, use Playwright's storage state:

```javascript
// e2e/auth.setup.js
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');

  // Save signed-in state
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

Then use it in tests:

```javascript
test.use({ storageState: 'e2e/.auth/user.json' });
```

---

## Best Practices

### General

1. **Test Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or implementation details

2. **Arrange-Act-Assert (AAA) Pattern**
   ```javascript
   it('should do something', () => {
     // Arrange - setup
     const input = 'test';

     // Act - perform action
     const result = myFunction(input);

     // Assert - verify result
     expect(result).toBe('expected');
   });
   ```

3. **Use Descriptive Test Names**
   - ✅ `it('should show error when email is invalid')`
   - ❌ `it('test email validation')`

4. **Keep Tests Independent**
   - Each test should run in isolation
   - Don't rely on test execution order
   - Clean up after each test

5. **Mock External Dependencies**
   - Mock Firebase, Stripe, and external APIs
   - Use test fixtures for predictable data

### React Testing Library

1. **Query Priority**
   ```javascript
   // Prefer (in order):
   screen.getByRole('button', { name: 'Submit' })
   screen.getByLabelText('Email')
   screen.getByPlaceholderText('Enter email')
   screen.getByText('Welcome')
   screen.getByTestId('custom-element') // Last resort
   ```

2. **Async Testing**
   ```javascript
   // Use waitFor for async updates
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });

   // Or findBy queries (built-in waitFor)
   expect(await screen.findByText('Loaded')).toBeInTheDocument();
   ```

3. **User Events**
   ```javascript
   // Prefer userEvent over fireEvent
   import userEvent from '@testing-library/user-event';

   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');
   ```

### Playwright

1. **Wait for Elements**
   ```javascript
   // Auto-waiting (preferred)
   await page.click('button');

   // Explicit waiting when needed
   await page.waitForSelector('.loaded');
   await page.waitForURL('/dashboard');
   ```

2. **Locators**
   ```javascript
   // Prefer accessible selectors
   page.getByRole('button', { name: 'Submit' })
   page.getByLabel('Email')
   page.getByPlaceholder('Search')
   page.getByText('Welcome')

   // Fallback to CSS/XPath
   page.locator('.my-class')
   ```

3. **Assertions**
   ```javascript
   // Use Playwright assertions (auto-retry)
   await expect(page.locator('h1')).toHaveText('Title');
   await expect(page).toHaveURL('/dashboard');
   ```

---

## Coverage Goals

### Current Coverage Target: 70%+

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Priority Areas for Coverage

1. **Critical Business Logic** (Target: 90%+)
   - Authentication flows
   - Payment processing
   - Data calculations
   - Tier/permission checks

2. **Utilities** (Target: 80%+)
   - Pure functions
   - Helper methods
   - Validation logic

3. **UI Components** (Target: 60%+)
   - Focus on interactive components
   - Test user interactions
   - Verify accessibility

### Excluded from Coverage

- Test files
- Mocks
- Configuration files
- Type definitions

---

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

### GitHub Actions Workflow

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
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run E2E tests
        run: npx playwright install && npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Troubleshooting

### Tests Won't Run

```bash
# Clear cache
npm run test:run -- --no-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Playwright Issues

```bash
# Reinstall browsers
npx playwright install

# Update Playwright
npm install -D @playwright/test@latest
```

### Firebase Mock Issues

If Firebase tests fail, verify mocks are properly configured in `src/tests/mocks/firebase.js`.

### Coverage Not Generating

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Run with coverage
npm run test:coverage
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Test Statistics

### Current Status

- **Total Tests Written**: 30+
- **Unit Tests**: 15+
- **Integration Tests**: 10+
- **E2E Tests**: 5+
- **Coverage**: Run `npm run test:coverage` to see latest

### Test Execution Time

- **Unit Tests**: ~5 seconds
- **Integration Tests**: ~10 seconds
- **E2E Tests**: ~30-60 seconds
- **Full Suite**: ~1-2 minutes
