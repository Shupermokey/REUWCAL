import { vi } from 'vitest';

// Mock Stripe functions
export const mockStartCheckout = vi.fn(() => Promise.resolve());
export const mockOpenBillingPortal = vi.fn(() => Promise.resolve());
export const mockHandleCheckout = vi.fn(() => Promise.resolve());

export const MOCK_PRICE_IDS = {
  Marketing: 'price_mock_marketing',
  Developer: 'price_mock_developer',
  Syndicator: 'price_mock_syndicator',
};

// Mock Stripe service
vi.mock('@/utils/stripeService', () => ({
  startCheckout: mockStartCheckout,
  openBillingPortal: mockOpenBillingPortal,
  handleCheckout: mockHandleCheckout,
  PRICE_IDS: MOCK_PRICE_IDS,
}));
