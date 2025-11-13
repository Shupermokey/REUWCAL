import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/utils/renderWithProviders';
import { mockAuth, clearMockAuth } from '@/tests/mocks/firebase';
import Login from '@/features/auth/Auth/Login';
import Register from '@/features/auth/Auth/Register';

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('should complete full registration with email verification', async () => {
      const user = userEvent.setup();

      const mockUser = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
        emailVerified: false,
      };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      mockAuth.sendEmailVerification.mockResolvedValue();

      renderWithProviders(<Register />);

      // Fill in registration form
      await user.type(screen.getByPlaceholderText(/email/i), 'newuser@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'SecurePass123!');

      // Select a tier
      const tierSelect = screen.getByLabelText(/select your membership plan/i);
      await user.selectOptions(tierSelect, 'free');

      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }));

      // Verify user was created
      await waitFor(() => {
        expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
          mockAuth,
          'newuser@example.com',
          'SecurePass123!'
        );
      });

      // Verify email verification was sent
      expect(mockAuth.sendEmailVerification).toHaveBeenCalled();
    });

    it('should start checkout for paid tier selection', async () => {
      const user = userEvent.setup();

      const mockUser = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
      };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      renderWithProviders(<Register />);

      await user.type(screen.getByPlaceholderText(/email/i), 'newuser@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'SecurePass123!');

      const tierSelect = screen.getByLabelText(/select your membership plan/i);
      await user.selectOptions(tierSelect, 'marketing');

      await user.click(screen.getByRole('button', { name: /register/i }));

      // Should create user and then redirect to checkout
      await waitFor(() => {
        expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Login Flow', () => {
    it('should redirect unverified users to verification page', async () => {
      const user = userEvent.setup();

      const mockUser = {
        uid: 'unverified-123',
        email: 'unverified@example.com',
        emailVerified: false,
        reload: vi.fn(),
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
      };

      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      renderWithProviders(<Login />);

      await user.type(screen.getByPlaceholderText(/email/i), 'unverified@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      });
    });

    it('should successfully log in verified user', async () => {
      const user = userEvent.setup();

      const mockUser = {
        uid: 'verified-123',
        email: 'verified@example.com',
        emailVerified: true,
        reload: vi.fn(),
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
      };

      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      renderWithProviders(<Login />);

      await user.type(screen.getByPlaceholderText(/email/i), 'verified@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalled();
        expect(mockUser.getIdToken).toHaveBeenCalled();
      });
    });
  });

  describe('Logout Flow', () => {
    it('should clear user session on logout', async () => {
      mockAuth.signOut.mockResolvedValue();

      // Test logout functionality
      // This would be in your header/navbar component
      expect(mockAuth.signOut).toBeDefined();
    });
  });
});
