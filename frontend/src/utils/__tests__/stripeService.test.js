import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCheckout, handleBillingPortal, PRICE_IDS } from '../stripeService';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('../services/firebaseConfig', () => ({
  db: { mockDb: true },
}));

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
    global.fetch = vi.fn();
  });

  describe('PRICE_IDS', () => {
    it('should export price IDs from environment variables', () => {
      expect(PRICE_IDS).toBeDefined();
      expect(typeof PRICE_IDS).toBe('object');
    });
  });

  describe('handleCheckout', () => {
    it('should redirect to checkout URL on success', async () => {
      const mockUid = 'user123';
      const mockTier = 'Marketing';
      const mockCheckoutUrl = 'https://checkout.stripe.com/session123';

      // Mock Firestore user exists
      firestore.doc.mockReturnValue({ mockDocRef: true });
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ uid: mockUid }),
      });

      // Mock fetch success
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ checkoutUrl: mockCheckoutUrl }),
      });

      await handleCheckout(mockUid, mockTier);

      expect(firestore.getDoc).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscription/create-checkout-session'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: mockUid, tier: mockTier }),
        })
      );
      expect(window.location.href).toBe(mockCheckoutUrl);
    });

    it('should not proceed if user not found in Firestore', async () => {
      firestore.doc.mockReturnValue({ mockDocRef: true });
      firestore.getDoc.mockResolvedValue({
        exists: () => false,
      });

      await handleCheckout('user123', 'Marketing');

      expect(console.error).toHaveBeenCalledWith('❌ User not found in Firestore.');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      firestore.doc.mockReturnValue({ mockDocRef: true });
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
      });

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Mock alert
      global.alert = vi.fn();

      await handleCheckout('user123', 'Marketing');

      expect(console.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Error processing checkout. Try again.');
    });
  });

  describe('handleBillingPortal', () => {
    it('should redirect to billing portal on success', async () => {
      const mockUid = 'user123';
      const mockPortalUrl = 'https://billing.stripe.com/session123';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ url: mockPortalUrl }),
      });

      delete window.location;
      window.location = { assign: vi.fn() };

      await handleBillingPortal(mockUid);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/createPortalLink'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            uid: mockUid,
            return_url: expect.any(String),
          }),
        })
      );
      expect(window.location.assign).toHaveBeenCalledWith(mockPortalUrl);
    });

    it('should throw error if uid is missing', async () => {
      await expect(handleBillingPortal()).rejects.toThrow('Missing uid');
    });
  });
});
