import { describe, it, expect } from 'vitest';
import { TIERS, tierRank, meetsTier, resolveTierFromSubscriptions } from '../tiers';

describe('tiers', () => {
  describe('TIERS constant', () => {
    it('should have all tier levels defined', () => {
      expect(TIERS.Free).toBe('Free');
      expect(TIERS.Marketing).toBe('Marketing');
      expect(TIERS.Developer).toBe('Developer');
      expect(TIERS.Syndicator).toBe('Syndicator');
    });

    it('should be frozen (immutable)', () => {
      expect(() => {
        TIERS.NewTier = 'NewTier';
      }).toThrow();
    });
  });

  describe('tierRank', () => {
    it('should return correct rank for each tier', () => {
      expect(tierRank(TIERS.Free)).toBe(0);
      expect(tierRank(TIERS.Marketing)).toBe(1);
      expect(tierRank(TIERS.Developer)).toBe(2);
      expect(tierRank(TIERS.Syndicator)).toBe(3);
    });

    it('should return 0 for undefined tier', () => {
      expect(tierRank(undefined)).toBe(0);
      expect(tierRank(null)).toBe(0);
      expect(tierRank('InvalidTier')).toBe(0);
    });
  });

  describe('meetsTier', () => {
    it('should return true when user tier meets or exceeds required tier', () => {
      expect(meetsTier(TIERS.Developer, TIERS.Free)).toBe(true);
      expect(meetsTier(TIERS.Developer, TIERS.Marketing)).toBe(true);
      expect(meetsTier(TIERS.Developer, TIERS.Developer)).toBe(true);
    });

    it('should return false when user tier is below required tier', () => {
      expect(meetsTier(TIERS.Free, TIERS.Marketing)).toBe(false);
      expect(meetsTier(TIERS.Marketing, TIERS.Developer)).toBe(false);
      expect(meetsTier(TIERS.Developer, TIERS.Syndicator)).toBe(false);
    });

    it('should handle undefined tiers gracefully', () => {
      expect(meetsTier(undefined, TIERS.Free)).toBe(true);
      expect(meetsTier(undefined, TIERS.Marketing)).toBe(false);
      expect(meetsTier(TIERS.Marketing, undefined)).toBe(true);
    });
  });

  describe('resolveTierFromSubscriptions', () => {
    const mockPriceIds = {
      marketing: 'price_marketing_test',
      developer: 'price_developer_test',
      syndicator: 'price_syndicator_test',
    };

    // Mock environment variables
    beforeEach(() => {
      vi.stubEnv('VITE_STRIPE_PRICE_MARKETING', mockPriceIds.marketing);
      vi.stubEnv('VITE_STRIPE_PRICE_DEVELOPER', mockPriceIds.developer);
      vi.stubEnv('VITE_STRIPE_PRICE_SYNDICATOR', mockPriceIds.syndicator);
    });

    it('should return Free tier for empty subscriptions', () => {
      expect(resolveTierFromSubscriptions([])).toBe(TIERS.Free);
    });

    it('should resolve Marketing tier from subscription', () => {
      const subs = [
        {
          items: [
            { price: { id: mockPriceIds.marketing } },
          ],
        },
      ];
      expect(resolveTierFromSubscriptions(subs)).toBe(TIERS.Marketing);
    });

    it('should resolve highest tier when multiple subscriptions exist', () => {
      const subs = [
        { items: [{ price: { id: mockPriceIds.marketing } }] },
        { items: [{ price: { id: mockPriceIds.syndicator } }] },
      ];
      expect(resolveTierFromSubscriptions(subs)).toBe(TIERS.Syndicator);
    });

    it('should handle subscriptions without items', () => {
      const subs = [{ items: [] }, {}];
      expect(resolveTierFromSubscriptions(subs)).toBe(TIERS.Free);
    });

    it('should handle undefined subscriptions', () => {
      expect(resolveTierFromSubscriptions(undefined)).toBe(TIERS.Free);
      expect(resolveTierFromSubscriptions(null)).toBe(TIERS.Free);
    });
  });
});
