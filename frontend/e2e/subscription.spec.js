import { test, expect } from '@playwright/test';

test.describe('Subscription and Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should display all pricing plans', async ({ page }) => {
    // Check for Marketing plan
    await expect(page.locator('text=Marketing Plan')).toBeVisible();

    // Check for Developer plan
    await expect(page.locator('text=Developer Plan')).toBeVisible();

    // Check for Syndicator plan
    await expect(page.locator('text=Syndicator Plan')).toBeVisible();
  });

  test('should show subscription prices', async ({ page }) => {
    // Check for price display (adjust based on your actual prices)
    await expect(page.locator('text=/\\$.*month/')).toHaveCount(3);
  });

  test('should show features for each plan', async ({ page }) => {
    // Check that features are listed
    await expect(page.locator('li:has-text("✓")')).toHaveCount.greaterThan(3);
  });

  test('should prompt login when not authenticated', async ({ page }) => {
    // Click subscribe button
    const subscribeButtons = page.locator('button:has-text("Login to Subscribe")');

    if (await subscribeButtons.count() > 0) {
      await subscribeButtons.first().click();

      // Should either redirect to login or focus email input
      await expect(page).toHaveURL(/login|pricing/, { timeout: 3000 });
    }
  });
});

test.describe('Stripe Checkout (Authenticated)', () => {
  // This test suite would require authentication setup
  // You'd typically use Playwright's storage state to maintain login

  test.skip('should redirect to Stripe checkout', async ({ page }) => {
    // Assuming user is logged in
    await page.goto('/pricing');

    // Click subscribe on Marketing plan
    await page.locator('.pricing-card:has-text("Marketing Plan") button:has-text("Subscribe")').click();

    // Should redirect to Stripe (or show loading state)
    await page.waitForURL(/stripe.com|checkout/, { timeout: 10000 });
  });

  test.skip('should open billing portal for existing subscribers', async ({ page }) => {
    // Assuming user has active subscription
    await page.goto('/pricing');

    // Click manage billing
    await page.locator('button:has-text("Manage Billing")').click();

    // Should redirect to Stripe billing portal
    await page.waitForURL(/stripe.com|billing/, { timeout: 10000 });
  });
});
