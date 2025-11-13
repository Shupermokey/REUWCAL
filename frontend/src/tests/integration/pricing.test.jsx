import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pricing from '../../components/Pricing/Pricing';
import { TIERS } from '../../constants/tiers';

// Mock providers and services
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../app/providers/SubscriptionProvider', () => ({
  useSubscription: vi.fn(),
}));

vi.mock('../../utils/stripeService', () => ({
  openBillingPortal: vi.fn(),
  startCheckout: vi.fn(),
  PRICE_IDS: {
    Marketing: 'price_marketing',
    Developer: 'price_developer',
    Syndicator: 'price_syndicator',
  },
}));

import { useAuth } from '../../app/providers/AuthProvider';
import { useSubscription } from '../../app/providers/SubscriptionProvider';
import { openBillingPortal, startCheckout } from '../../utils/stripeService';

describe('Pricing Component Integration', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/pricing' }),
      };
    });
  });

  const renderPricing = () => {
    return render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );
  };

  it('should render all pricing plans', () => {
    useAuth.mockReturnValue({ user: null });
    useSubscription.mockReturnValue({
      tier: TIERS.Free,
      subscriptions: [],
    });

    renderPricing();

    expect(screen.getByText('Marketing Plan')).toBeInTheDocument();
    expect(screen.getByText('Developer Plan')).toBeInTheDocument();
    expect(screen.getByText('Syndicator Plan')).toBeInTheDocument();
  });

  it('should show "Login to Subscribe" when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null });
    useSubscription.mockReturnValue({
      tier: TIERS.Free,
      subscriptions: [],
    });

    renderPricing();

    const buttons = screen.getAllByText('Login to Subscribe');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show "Manage Billing" for current plan', () => {
    useAuth.mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
    });
    useSubscription.mockReturnValue({
      tier: TIERS.Developer,
      subscriptions: [{ id: 'sub_123' }],
    });

    renderPricing();

    expect(screen.getByText('Manage Billing')).toBeInTheDocument();
  });

  it('should call startCheckout when subscribe button is clicked', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    useAuth.mockReturnValue({ user: mockUser });
    useSubscription.mockReturnValue({
      tier: TIERS.Free,
      subscriptions: [],
    });

    startCheckout.mockResolvedValue();

    renderPricing();

    const subscribeButtons = screen.getAllByText('Subscribe');
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith(mockUser.uid, 'price_marketing');
    });
  });

  it('should call openBillingPortal when manage billing is clicked', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    useAuth.mockReturnValue({ user: mockUser });
    useSubscription.mockReturnValue({
      tier: TIERS.Marketing,
      subscriptions: [{ id: 'sub_123' }],
    });

    openBillingPortal.mockResolvedValue();

    renderPricing();

    const manageBillingButton = screen.getByText('Manage Billing');
    fireEvent.click(manageBillingButton);

    await waitFor(() => {
      expect(openBillingPortal).toHaveBeenCalledWith(mockUser.uid);
    });
  });

  it('should store pending plan when not logged in', async () => {
    useAuth.mockReturnValue({ user: null });
    useSubscription.mockReturnValue({
      tier: TIERS.Free,
      subscriptions: [],
    });

    renderPricing();

    const subscribeButtons = screen.getAllByText('Login to Subscribe');
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith('pendingPlan', 'Marketing');
    });
  });

  it('should handle subscription errors gracefully', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    useAuth.mockReturnValue({ user: mockUser });
    useSubscription.mockReturnValue({
      tier: TIERS.Free,
      subscriptions: [],
    });

    startCheckout.mockRejectedValue(new Error('Stripe error'));
    global.alert = vi.fn();

    renderPricing();

    const subscribeButtons = screen.getAllByText('Subscribe');
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Could not start checkout. Please try again.');
    });
  });
});
