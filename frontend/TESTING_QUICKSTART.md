# Testing Quick Start Guide

## 📦 Installation

Run this command in your `frontend` directory:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

## ✅ What's Already Set Up

I've created the following for you:

### Configuration
- ✅ `vite.config.js` - Updated with test configuration
- ✅ `package.json` - Added test scripts

### Test Infrastructure
- ✅ `src/tests/setup.js` - Test environment setup
- ✅ `src/tests/utils/renderWithProviders.jsx` - Helper to render with context
- ✅ `src/tests/mocks/firebase.js` - Mock Firebase functions
- ✅ `src/tests/mocks/stripe.js` - Mock Stripe functions
- ✅ `src/tests/utils/testData.js` - Sample test data

### Sample Tests
- ✅ `src/features/auth/Auth/Login.test.jsx` - Login component tests
- ✅ `src/components/Pricing/Pricing.test.jsx` - Pricing component tests
- ✅ `src/tests/integration/authFlow.test.jsx` - Full auth flow tests

## 🚀 Running Tests

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run all tests once (for CI/CD)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (interactive)
npm run test:ui

# Run specific test file
npm test Login.test.jsx

# Run tests matching a pattern
npm test -- --grep="subscription"
```

## 📝 Writing Your First Test

### Example: Testing a Button Component

```javascript
// src/components/Button/Button.test.jsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/utils/renderWithProviders';
import Button from './Button';

describe('Button Component', () => {
  it('should render with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText(/click me/i));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithProviders(<Button disabled>Click me</Button>);
    expect(screen.getByText(/click me/i)).toBeDisabled();
  });
});
```

## 🎯 Testing Checklist - What Should You Test?

### 🔴 CRITICAL (Test First)
- [ ] User can log in with email/password
- [ ] User can register
- [ ] User can sign in with Google
- [ ] Subscription checkout redirects to Stripe
- [ ] Free tier limits (5 properties max)
- [ ] Property calculations are correct

### 🟡 IMPORTANT (Test Soon)
- [ ] Form validation works
- [ ] Error messages display
- [ ] Loading states show
- [ ] Protected routes redirect
- [ ] Logout clears session

### 🟢 NICE TO HAVE (Test Eventually)
- [ ] UI components render correctly
- [ ] Responsive design works
- [ ] Accessibility features

## 📚 Common Testing Patterns

### Pattern 1: Testing Forms

```javascript
it('should validate email input', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);

  const emailInput = screen.getByPlaceholderText(/email/i);
  await user.type(emailInput, 'invalid-email');
  await user.tab(); // Trigger blur

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

### Pattern 2: Testing Async Operations

```javascript
it('should load data on mount', async () => {
  renderWithProviders(<DataComponent />);

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(screen.getByText(/data loaded/i)).toBeInTheDocument();
});
```

### Pattern 3: Testing Navigation

```javascript
it('should navigate to dashboard on success', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Login />, { route: '/login' });

  // ... perform login ...

  await waitFor(() => {
    expect(window.location.pathname).toBe('/dashboard');
  });
});
```

### Pattern 4: Testing with Mocked Data

```javascript
import { mockUsers } from '@/tests/utils/testData';

it('should display user info', () => {
  setMockAuthUser(mockUsers.free);
  renderWithProviders(<UserProfile />);

  expect(screen.getByText(mockUsers.free.email)).toBeInTheDocument();
});
```

## 🐛 Debugging Tests

### View what's rendered:
```javascript
import { screen } from '@testing-library/react';

// Print the entire DOM
screen.debug();

// Print a specific element
screen.debug(screen.getByRole('button'));
```

### Check what queries are available:
```javascript
// Shows all available queries for an element
screen.getByRole('button'); // If this fails, you'll see all available roles
```

### Use test:ui for interactive debugging:
```bash
npm run test:ui
```

## 📖 Resources

- **Full Testing Guide**: See `TESTING_GUIDE.md` in project root
- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## 🔄 Next Steps

1. **Install dependencies** (run the npm install command above)
2. **Run existing tests** to make sure setup works:
   ```bash
   npm run test:run
   ```
3. **Write tests for your critical features** (auth, subscriptions, property limits)
4. **Add tests to your CI/CD pipeline**
5. **Run tests before every commit**

## 💡 Pro Tips

1. **Test user behavior, not implementation**
   - ✅ Good: "User can click subscribe and see checkout"
   - ❌ Bad: "useState hook updates correctly"

2. **Use accessible queries**
   - Prefer `getByRole`, `getByLabelText`, `getByPlaceholderText`
   - Avoid `getByTestId` unless necessary

3. **Keep tests simple**
   - One assertion per test when possible
   - Clear test names that describe what's being tested

4. **Mock external dependencies**
   - Always mock Firebase
   - Always mock Stripe
   - Mock API calls

5. **Run tests frequently**
   - Before committing
   - Before deploying
   - When refactoring

Happy Testing! 🎉
