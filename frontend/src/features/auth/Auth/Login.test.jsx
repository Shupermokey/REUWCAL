import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { renderWithProviders } from '@/tests/utils/renderWithProviders';
import { mockAuth, setMockAuthUser, clearMockAuth } from '@/tests/mocks/firebase';

describe('Login Component', () => {
  beforeEach(() => {
    clearMockAuth();
  });

  it('should render login form with all elements', () => {
    renderWithProviders(<Login />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should render Google sign-in button', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it('should render magic link option', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText(/magic link/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // HTML5 validation should prevent submission
    expect(emailInput).toBeInvalid();
  });

  it('should require both email and password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    expect(emailInput).toBeInvalid();
    expect(passwordInput).toBeInvalid();
  });

  it('should call signInWithEmailAndPassword on form submit', async () => {
    const user = userEvent.setup();
    mockAuth.signInWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'test-123',
        email: 'test@example.com',
        emailVerified: true,
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
        reload: vi.fn().mockResolvedValue(undefined),
      },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    mockAuth.signInWithEmailAndPassword.mockRejectedValue({
      message: 'Invalid credentials',
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByPlaceholderText(/email/i), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should navigate to magic link page when clicking magic link button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const magicLinkButton = screen.getByText(/magic link/i);
    await user.click(magicLinkButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/magic-link');
    });
  });
});
