# React + Firebase + Stripe SaaS Application

[![PR Checks](https://github.com/your-org/your-repo/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/your-org/your-repo/actions/workflows/pr-checks.yml)
[![Deploy Staging](https://github.com/your-org/your-repo/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/your-org/your-repo/actions/workflows/deploy-staging.yml)
[![Deploy Production](https://github.com/your-org/your-repo/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/your-org/your-repo/actions/workflows/deploy-production.yml)
[![codecov](https://codecov.io/gh/your-org/your-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/your-repo)

A production-ready React application with Firebase backend and Stripe payments.

## ✨ Features

- 🔐 **Authentication** - Email/password, Google OAuth, magic links
- 💳 **Subscription Management** - Stripe-powered tiered subscriptions
- 🏠 **Property Management** - Multi-property real estate calculations
- 📊 **Income Statements** - Dynamic financial modeling
- 🎨 **Modern UI** - Responsive design with drag-and-drop
- 🧪 **Comprehensive Testing** - 60+ tests with 70%+ coverage
- 🚀 **CI/CD Pipeline** - Automated testing and deployment
- 📈 **Monitoring** - Sentry error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/your-repo.git
cd your-repo/frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with Firebase and Stripe credentials

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
frontend/
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   └── dependabot.yml     # Automated dependency updates
├── .husky/                # Git hooks
├── e2e/                   # End-to-end tests
├── src/
│   ├── app/
│   │   └── providers/     # React Context providers
│   ├── components/        # Reusable UI components
│   ├── constants/         # App constants
│   ├── features/          # Feature modules
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   │   └── firestore/     # Firestore services
│   ├── styles/            # CSS files
│   ├── tests/             # Test setup and utilities
│   └── utils/             # Utility functions
├── CICD.md               # CI/CD documentation
├── TESTING.md            # Testing guide
└── package.json
```

## 🧪 Testing

```bash
# Run unit & integration tests
npm test

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## 🏗️ Building

```bash
# Development build
npm run build

# Production build (with minification)
NODE_ENV=production npm run build

# Preview production build
npm run preview
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run check:unused` | Check for unused dependencies |

## 🚀 Deployment

This project uses GitHub Actions for CI/CD.

### Staging

Automatically deploys to staging on push to `develop` branch.

```bash
git push origin develop
```

### Production

1. Merge `develop` to `main`
2. Create a version tag
3. Push to GitHub
4. Approve deployment in GitHub Actions

```bash
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

See [CICD.md](./CICD.md) for detailed deployment documentation.

## 🔑 Environment Variables

Required environment variables (see `.env.example`):

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICE_MARKETING=
VITE_STRIPE_PRICE_DEVELOPER=
VITE_STRIPE_PRICE_SYNDICATOR=

# API
VITE_API_URL=
VITE_API_URL_PRODUCTION=
VITE_ENVIRONMENT=
```

## 🛡️ Security

- ✅ All secrets stored in environment variables
- ✅ Firebase security rules enforced
- ✅ Automated security scanning in CI/CD
- ✅ Dependabot for dependency updates
- ✅ No secrets in git history

## 📈 Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | 80% | ~40% |
| Build Time | < 60s | ~3s |
| Bundle Size | < 500KB | 691KB |
| Lighthouse Score | 90+ | TBD |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

All PRs require:
- ✅ All tests passing
- ✅ No linting errors
- ✅ Code review approval
- ✅ Up-to-date with main branch

## 📝 License

This project is private and proprietary.

## 👥 Team

- **Product Owner**: Your Name
- **Tech Lead**: Your Name
- **DevOps**: Your Name

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/your-repo/issues)
- **Slack**: #engineering
- **Email**: dev@yourcompany.com

## 🎯 Roadmap

### Phase 1: Critical Fixes ✅
- [x] Fix missing imports
- [x] Environment variable setup
- [x] Remove duplicate code
- [x] Fix hardcoded URLs

### Phase 2: Testing Infrastructure ✅
- [x] Unit tests (37+ tests)
- [x] Integration tests (12+ tests)
- [x] E2E tests (15+ scenarios)
- [x] Coverage reporting

### Phase 3: CI/CD Pipeline ✅
- [x] PR checks workflow
- [x] Staging deployment
- [x] Production deployment
- [x] Git hooks
- [x] Dependabot

### Phase 4: Performance Optimization (In Progress)
- [ ] Bundle optimization
- [ ] Code splitting
- [ ] React.memo optimization
- [ ] Caching strategy

### Phase 5: Security Hardening (Planned)
- [ ] Firebase security rules
- [ ] API rate limiting
- [ ] Content Security Policy
- [ ] Security audit

## 📚 Documentation

- [Testing Guide](./TESTING.md)
- [CI/CD Pipeline](./CICD.md)
- [Architecture Documentation](./ARCHITECTURE.md) (TODO)
- [API Documentation](./API.md) (TODO)

## 🔗 Links

- **Staging**: https://staging.yourapp.com
- **Production**: https://yourapp.com
- **Firebase Console**: https://console.firebase.google.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Sentry**: https://sentry.io/organizations/your-org

---

Made with ❤️ by Your Team
