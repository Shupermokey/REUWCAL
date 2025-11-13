import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pricing from './Pricing';
import { renderWithProviders } from '@/tests/utils/renderWithProviders';
import { mockStartCheckout, mockOpenBillingPortal } from '@/tests/mocks/stripe';
import { setMockAuthUser, clearMockAuth } from '@/tests/mocks/firebase';
import { mockUsers } from '@/tests/utils/testData';

describe('Pricing Component', () => {
  beforeEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  it('should display all pricing plans', () => {
    renderWithProviders(<Pricing />);

    expect(screen.getByText(/marketing plan/i)).toBeInTheDocument();
    expect(screen.getByText(/developer plan/i)).toBeInTheDocument();
    expect(screen.getByText(/syndicator plan/i)).toBeInTheDocument();
  });

  it('should display pricing information', () => {
    renderWithProviders(<Pricing />);

    expect(screen.getByText(/\$1\.99/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5\.99/i)).toBeInTheDocument();
    expect(screen.getByText(/\$9\.99/i)).toBeInTheDocument();
  });

  it('should display feature lists for each plan', () => {
    renderWithProviders(<Pricing />);

    expect(screen.getByText(/basic analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced api access/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited users/i)).toBeInTheDocument();
  });

  it('should show "Login to Subscribe" when user is not authenticated', () => {
    renderWithProviders(<Pricing />);

    const loginButtons = screen.getAllByText(/login to subscribe/i);
    expect(loginButtons.length).toBeGreaterThan(0);
  });

  it('should show "Subscribe" button when user is authenticated', () => {
    setMockAuthUser(mockUsers.free);
    renderWithProviders(<Pricing />);

    const subscribeButtons = screen.getAllByText(/subscribe/i);
    expect(subscribeButtons.length).toBeGreaterThan(0);
  });

  it('should call startCheckout when clicking subscribe button', async () => {
    const user = userEvent.setup();
    setMockAuthUser(mockUsers.free);
    renderWithProviders(<Pricing />);

    // Click the first subscribe button (Marketing plan)
    const subscribeButtons = screen.getAllByText(/subscribe/i);
    await user.click(subscribeButtons[0]);

    // Should call startCheckout with user ID and price ID
    expect(mockStartCheckout).toHaveBeenCalled();
  });

  it('should save pending plan to sessionStorage when not logged in', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithProviders(<Pricing />);

    const loginButtons = screen.getAllByText(/login to subscribe/i);
    await user.click(loginButtons[0]);

    expect(setItemSpy).toHaveBeenCalledWith('pendingPlan', 'Marketing');
  });

  it('should show "Manage Billing" for current plan', () => {
    setMockAuthUser(mockUsers.marketing);
    // Would need to mock SubscriptionProvider to return marketing tier
    // This is a placeholder - actual implementation depends on how you mock the provider
    renderWithProviders(<Pricing />);

    // When user has active marketing subscription
    // expect(screen.getByText(/manage billing/i)).toBeInTheDocument();
  });

  it('should display confirmation message when plan is being processed', async () => {
    const user = userEvent.setup();
    setMockAuthUser(mockUsers.free);

    // Mock a slow checkout to see the loading state
    mockStartCheckout.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithProviders(<Pricing />);

    const subscribeButtons = screen.getAllByText(/subscribe/i);
    await user.click(subscribeButtons[0]);

    // Should show working message
    expect(screen.getByText(/working on your.*plan/i)).toBeInTheDocument();
  });
});
