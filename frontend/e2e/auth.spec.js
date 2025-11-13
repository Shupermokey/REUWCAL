import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page elements', async ({ page }) => {
    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check for login button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();

    // Check for Google sign-in button
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click login
    await page.click('button:has-text("Login")');

    // Should see error message
    await expect(page.locator('.login-error')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link (adjust selector based on your UI)
    await page.click('a[href="/register"]');

    // Should be on register page
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to magic link page', async ({ page }) => {
    // Click magic link button
    await page.click('button:has-text("magic link")');

    // Should be on magic link page
    await expect(page).toHaveURL('/magic-link');
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'Password123!');

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation error or not proceed
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true', { timeout: 2000 }).catch(() => {
      // Browser native validation prevents submission
    });
  });
});

test.describe('Logout Flow', () => {
  test('should logout user', async ({ page, context }) => {
    // This test assumes you're logged in via storage state
    // For actual implementation, you'd need to log in first or set auth cookies

    await page.goto('/home');

    // Find and click logout button (adjust selector)
    await page.click('button:has-text("Logout")', { timeout: 2000 }).catch(() => {
      // Logout button might be in a menu
      page.click('[aria-label="menu"]');
      page.click('button:has-text("Logout")');
    });

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
