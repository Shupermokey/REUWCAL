import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoutes/ProtectedRoute';
import { TIERS } from '../../constants/tiers';

// Mock providers
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(),
}));

import { useAuth } from '../../app/providers/AuthProvider';
import { useTier } from '../../hooks/useTier';

describe('ProtectedRoute Integration', () => {
  const TestComponent = () => <div>Protected Content</div>;
  const LoginPage = () => <div>Login Page</div>;
  const PricingPage = () => <div>Pricing Page</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderProtectedRoute = (minTier = TIERS.Free) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route element={<ProtectedRoute minTier={minTier} />}>
            <Route path="/protected" element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('should show loading state while authentication is loading', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: true,
    });
    useTier.mockReturnValue({
      tier: null,
      isLoading: true,
    });

    renderProtectedRoute();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
    });
    useTier.mockReturnValue({
      tier: TIERS.Free,
      isLoading: false,
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('should show protected content when user meets tier requirement', async () => {
    useAuth.mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      loading: false,
    });
    useTier.mockReturnValue({
      tier: TIERS.Developer,
      isLoading: false,
    });

    renderProtectedRoute(TIERS.Marketing);

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should redirect to pricing when user does not meet tier requirement', async () => {
    useAuth.mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      loading: false,
    });
    useTier.mockReturnValue({
      tier: TIERS.Free,
      isLoading: false,
    });

    renderProtectedRoute(TIERS.Marketing);

    await waitFor(() => {
      expect(screen.getByText('Pricing Page')).toBeInTheDocument();
    });
  });

  it('should handle tier loading state separately from auth', () => {
    useAuth.mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      loading: false,
    });
    useTier.mockReturnValue({
      tier: null,
      isLoading: true,
    });

    renderProtectedRoute();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
