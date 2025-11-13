import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerUser,
  loginUser,
  logoutUser,
  handleSignInWithGoogle,
} from '../authService';
import * as firebaseAuth from 'firebase/auth';

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
}));

// Mock firebaseConfig
vi.mock('../firebaseConfig', () => ({
  auth: { mockAuth: true },
  googleProvider: { mockProvider: true },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create user with email and password', async () => {
      const mockUserCredential = {
        user: { uid: '123', email: 'test@example.com' },
      };
      firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await registerUser('test@example.com', 'password123');

      expect(result).toEqual(mockUserCredential);
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        { mockAuth: true },
        'test@example.com',
        'password123'
      );
    });

    it('should throw error when registration fails', async () => {
      const error = new Error('Registration failed');
      firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(registerUser('test@example.com', 'weak')).rejects.toThrow('Registration failed');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should sign in user with email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      const mockUserCredential = { user: mockUser };
      firebaseAuth.signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await loginUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        { mockAuth: true },
        'test@example.com',
        'password123'
      );
    });

    it('should throw error when login fails', async () => {
      const error = new Error('Invalid credentials');
      firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(loginUser('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logoutUser', () => {
    it('should sign out current user', async () => {
      firebaseAuth.signOut.mockResolvedValue();

      await logoutUser();

      expect(firebaseAuth.signOut).toHaveBeenCalledWith({ mockAuth: true });
      expect(console.log).toHaveBeenCalledWith('User logged out');
    });

    it('should throw error when logout fails', async () => {
      const error = new Error('Logout failed');
      firebaseAuth.signOut.mockRejectedValue(error);

      await expect(logoutUser()).rejects.toThrow('Logout failed');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('handleSignInWithGoogle', () => {
    it('should sign in with Google popup', async () => {
      const mockResult = {
        user: { uid: '123', email: 'test@gmail.com' },
      };
      firebaseAuth.signInWithPopup.mockResolvedValue(mockResult);

      const result = await handleSignInWithGoogle();

      expect(result).toEqual(mockResult);
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(
        { mockAuth: true },
        { mockProvider: true }
      );
    });

    it('should throw error when Google sign-in fails', async () => {
      const error = new Error('Google sign-in cancelled');
      firebaseAuth.signInWithPopup.mockRejectedValue(error);

      await expect(handleSignInWithGoogle()).rejects.toThrow('Google sign-in cancelled');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
