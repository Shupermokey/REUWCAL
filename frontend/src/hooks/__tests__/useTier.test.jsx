import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTier } from '../useTier';
import { TIERS } from '../../constants/tiers';

// Mock SubscriptionProvider
vi.mock('../../app/providers/SubscriptionProvider', () => ({
  useSubscription: vi.fn(),
}));

import { useSubscription } from '../../app/providers/SubscriptionProvider';

describe('useTier', () => {
  it('should return tier information from subscription', () => {
    useSubscription.mockReturnValue({
      tier: TIERS.Developer,
      isLoading: false,
      subscriptions: [{ id: 'sub_123' }],
      source: 'stripe',
    });

    const { result } = renderHook(() => useTier());

    expect(result.current.tier).toBe(TIERS.Developer);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.subscriptions).toHaveLength(1);
    expect(result.current.source).toBe('stripe');
  });

  it('should indicate if user is on Free tier', () => {
    useSubscription.mockReturnValue({
      tier: TIERS.Free,
      isLoading: false,
      subscriptions: [],
      source: 'none',
    });

    const { result } = renderHook(() => useTier());

    expect(result.current.isFree).toBe(true);
  });

  it('should indicate if user is NOT on Free tier', () => {
    useSubscription.mockReturnValue({
      tier: TIERS.Marketing,
      isLoading: false,
      subscriptions: [{ id: 'sub_123' }],
      source: 'stripe',
    });

    const { result } = renderHook(() => useTier());

    expect(result.current.isFree).toBe(false);
  });

  it('should check if user meets required tier', () => {
    useSubscription.mockReturnValue({
      tier: TIERS.Developer,
      isLoading: false,
      subscriptions: [],
      source: 'stripe',
    });

    const { result } = renderHook(() => useTier());

    expect(result.current.meets(TIERS.Free)).toBe(true);
    expect(result.current.meets(TIERS.Marketing)).toBe(true);
    expect(result.current.meets(TIERS.Developer)).toBe(true);
    expect(result.current.meets(TIERS.Syndicator)).toBe(false);
  });

  it('should handle loading state', () => {
    useSubscription.mockReturnValue({
      tier: null,
      isLoading: true,
      subscriptions: [],
      source: 'none',
    });

    const { result } = renderHook(() => useTier());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.tier).toBe(null);
  });
});
