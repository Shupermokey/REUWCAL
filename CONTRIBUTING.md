# Contributing to REUWCAL

Thank you for your interest in contributing to REUWCAL! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Unprofessional conduct

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- Firebase account
- Stripe account (for payment testing)
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork and Clone**

```bash
git clone https://github.com/YOUR_USERNAME/REUWCAL.git
cd REUWCAL/frontend
```

2. **Install Dependencies**

```bash
npm install
```

3. **Environment Setup**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

4. **Start Development Server**

```bash
npm run dev
```

5. **Run Tests**

```bash
npm run test
```

---

## Development Workflow

### Branch Strategy

We use Git Flow:

```
main                 # Production-ready code
├── develop          # Development branch
│   ├── feature/*    # New features
│   ├── bugfix/*     # Bug fixes
│   ├── hotfix/*     # Urgent production fixes
│   └── release/*    # Release preparation
```

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

**Examples:**
- `feature/add-export-to-excel`
- `bugfix/fix-income-calculation`
- `docs/update-api-documentation`

---

## Code Standards

### JavaScript/React Guidelines

#### 1. Use Functional Components

```javascript
// ✅ Good
function MyComponent({ data }) {
  const [state, setState] = useState(null);
  return <div>{data}</div>;
}

// ❌ Avoid
class MyComponent extends React.Component {
  render() {
    return <div>{this.props.data}</div>;
  }
}
```

#### 2. Use Hooks Properly

```javascript
// ✅ Good
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependencies]);
}

// ❌ Avoid - useEffect without cleanup
useEffect(() => {
  const subscription = subscribeToData();
  // Missing: return () => subscription.unsubscribe();
}, []);
```

#### 3. Prop Types or TypeScript

```javascript
// ✅ Good (with PropTypes)
import PropTypes from 'prop-types';

function Button({ onClick, children, variant }) {
  return <button onClick={onClick}>{children}</button>;
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

// Better: TypeScript (future migration)
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}
```

#### 4. Destructure Props

```javascript
// ✅ Good
function UserCard({ name, email, avatar }) {
  return (
    <div>
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// ❌ Avoid
function UserCard(props) {
  return (
    <div>
      <img src={props.avatar} alt={props.name} />
      <h3>{props.name}</h3>
      <p>{props.email}</p>
    </div>
  );
}
```

#### 5. Use Meaningful Names

```javascript
// ✅ Good
const userProperties = properties.filter(p => p.userId === currentUser.uid);
const calculateNetOperatingIncome = (income, expenses) => income - expenses;

// ❌ Avoid
const arr = properties.filter(p => p.userId === currentUser.uid);
const calc = (a, b) => a - b;
```

#### 6. Keep Components Small

```javascript
// ✅ Good - Single responsibility
function PropertyCard({ property }) {
  return (
    <div className="card">
      <PropertyHeader property={property} />
      <PropertyDetails property={property} />
      <PropertyActions property={property} />
    </div>
  );
}

// ❌ Avoid - Too many responsibilities in one component
function PropertyCard({ property }) {
  // 200 lines of JSX and logic
}
```

#### 7. Error Handling

```javascript
// ✅ Good
import { tryCatchToast } from '@/utils/tryCatchToast';

async function saveProperty(data) {
  const result = await tryCatchToast(
    updateProperty(userId, propertyId, data),
    'Property saved successfully',
    'Failed to save property'
  );
  return result;
}

// ❌ Avoid - No error handling
async function saveProperty(data) {
  const result = await updateProperty(userId, propertyId, data);
  return result;
}
```

### File Organization

```
Component.jsx           # Component logic
Component.module.css    # Component styles (if using CSS modules)
Component.test.jsx      # Component tests
index.js                # Export file
```

### Import Order

```javascript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal components
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/Property/PropertyCard';

// 3. Services/Hooks
import { useAuth } from '@/hooks/useAuth';
import { getProperties } from '@/services/firestoreService';

// 4. Utils/Constants
import { tryCatchToast } from '@/utils/tryCatchToast';
import { TIERS } from '@/constants/tiers';

// 5. Styles
import './Component.css';
```

### CSS/Styling Guidelines

1. **Use Semantic Class Names**

```css
/* ✅ Good */
.property-card { }
.property-card__header { }
.property-card__title { }

/* ❌ Avoid */
.card1 { }
.blue-text { }
```

2. **Avoid Inline Styles (Except Dynamic Values)**

```javascript
// ✅ Good
<div className="property-card" />

// ✅ Also good (dynamic values)
<div style={{ backgroundColor: dynamicColor }} />

// ❌ Avoid
<div style={{ padding: '10px', margin: '20px', fontSize: '16px' }} />
```

---

## Testing Guidelines

### Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature/Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { /* ... */ };

      // Act
      render(<Component {...props} />);

      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

### Testing Best Practices

1. **Test User Behavior, Not Implementation**

```javascript
// ✅ Good
it('should display success message after saving', async () => {
  render(<PropertyForm />);

  fireEvent.change(screen.getByLabelText('Property Name'), {
    target: { value: 'Test Property' }
  });

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Property saved')).toBeInTheDocument();
});

// ❌ Avoid - Testing implementation details
it('should call setState with correct value', () => {
  const { result } = renderHook(() => useMyHook());
  result.current.setValue('test');
  expect(result.current.state).toBe('test');
});
```

2. **Use Testing Library Queries Correctly**

**Query Priority:**
1. `getByRole` - Accessibility-first
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Inputs
4. `getByText` - Display text
5. `getByTestId` - Last resort

3. **Mock External Dependencies**

```javascript
import { vi } from 'vitest';

vi.mock('@/services/firestoreService', () => ({
  getProperties: vi.fn().mockResolvedValue([
    { id: '1', name: 'Property 1' }
  ])
}));
```

4. **Test Coverage Guidelines**

- Aim for 80%+ coverage
- Focus on critical paths
- Test error scenarios
- Test edge cases

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build process or tooling changes
- `perf`: Performance improvements

### Examples

```
feat(income-statement): add export to Excel functionality

Implement Excel export using SheetJS library.
Includes formatting and multi-sheet support.

Closes #123
```

```
fix(auth): resolve login redirect loop

Fixed issue where users were stuck in redirect loop
after successful authentication.

Fixes #456
```

```
docs(api): update Firestore service documentation

Added examples for all CRUD operations and
real-time subscriptions.
```

### Rules

1. Use imperative mood ("add" not "added")
2. Don't capitalize first letter
3. No period at the end
4. Keep subject line under 72 characters
5. Include body for non-trivial changes
6. Reference issues in footer

### Pre-commit Checks

We use Husky to run checks before commits:

- ✅ ESLint
- ✅ Run tests for changed files
- ✅ Format check

If checks fail, the commit will be rejected.

---

## Pull Request Process

### Before Creating a PR

1. **Update Your Branch**

```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git rebase develop
```

2. **Run All Checks**

```bash
npm run lint
npm run test
npm run build
```

3. **Self-Review**
- Read through all changes
- Remove debug code
- Check for console.logs
- Verify no sensitive data

### Creating a PR

1. **Push to Your Fork**

```bash
git push origin your-feature-branch
```

2. **Open Pull Request**
- Base: `develop` (not `main`)
- Title: Clear, descriptive summary
- Description: Use the PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #(issue number)
```

### PR Review Process

1. **Automated Checks** (must pass)
   - Lint
   - Tests
   - Build
   - Security scan

2. **Code Review** (at least 1 approval)
   - Code quality
   - Test coverage
   - Documentation
   - Performance

3. **Merge Requirements**
   - All checks passing
   - No merge conflicts
   - Approved by reviewer
   - Up to date with base branch

### After PR Merge

1. Delete feature branch
2. Update local develop branch
3. Close related issues

---

## Project Structure

```
REUWCAL/
├── frontend/
│   ├── src/
│   │   ├── app/              # App configuration
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utilities
│   │   ├── constants/        # Constants
│   │   ├── config/           # Configuration
│   │   └── styles/           # Global styles
│   │
│   ├── tests/                # Test files
│   ├── public/               # Static assets
│   ├── .env.example          # Environment template
│   ├── vite.config.js        # Vite configuration
│   └── package.json
│
├── docs/                     # Documentation
├── .github/                  # GitHub workflows
├── firebase.json             # Firebase configuration
├── firestore.rules           # Firestore security rules
├── storage.rules             # Storage security rules
└── README.md
```

---

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Implement feature
3. Add tests (unit + integration)
4. Update documentation
5. Create PR
6. Address review feedback
7. Merge

### Fixing a Bug

1. Create bugfix branch
2. Write failing test
3. Fix bug
4. Verify test passes
5. Create PR
6. Merge

### Adding a New Component

```bash
# 1. Create component file
touch src/components/MyComponent/MyComponent.jsx

# 2. Create test file
touch src/components/MyComponent/MyComponent.test.jsx

# 3. Create index file
touch src/components/MyComponent/index.js
```

Component template:
```javascript
import React from 'react';
import PropTypes from 'prop-types';
import './MyComponent.css';

function MyComponent({ prop1, prop2 }) {
  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  );
}

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

MyComponent.defaultProps = {
  prop2: 0,
};

export default MyComponent;
```

### Adding a New Service Method

```javascript
// src/services/firestoreService.js

/**
 * Description of what this method does
 *
 * @param {string} userId - User's Firebase UID
 * @param {object} data - Data to save
 * @returns {Promise<string>} - Document ID
 */
export async function myNewMethod(userId, data) {
  // Validate input
  if (!userId || !data) {
    throw new Error('Missing required parameters');
  }

  // Implement method
  const docRef = await addDoc(collection(db, 'path'), data);
  return docRef.id;
}
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (careful!)
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Development Tips

### Debugging

1. **React DevTools**
   - Install React DevTools browser extension
   - Inspect component hierarchy
   - View props and state

2. **Redux DevTools** (if using Redux)
   - Track state changes
   - Time-travel debugging

3. **Console Methods**
```javascript
console.log('Basic log');
console.warn('Warning');
console.error('Error');
console.table(array); // Table format
console.group('Group');
console.groupEnd();
```

4. **Vite Dev Server**
   - Hot Module Replacement (HMR)
   - Error overlay
   - Source maps

### Performance Optimization

1. **React.memo** for expensive components
2. **useMemo** for expensive calculations
3. **useCallback** for stable function references
4. **Code splitting** with lazy loading
5. **Image optimization**

### Troubleshooting

**Build Fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`
- Check Node version: `node --version`

**Tests Fail:**
- Check mock setup
- Verify test dependencies
- Run individual test: `npm run test -- MyComponent.test.jsx`

**Firebase Issues:**
- Check environment variables
- Verify Firebase config
- Check Security Rules
- Review Firebase Console logs

---

## Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)

### Learning
- [React Patterns](https://reactpatterns.com/)
- [JavaScript Info](https://javascript.info/)
- [Web.dev](https://web.dev/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com/) (API testing)

---

## Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue
- **Security:** Email security@yourapp.com
- **General:** Slack/Discord channel

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

**Thank you for contributing to REUWCAL!** 🎉

Your contributions make this project better for everyone.
