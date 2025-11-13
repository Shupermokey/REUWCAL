import { vi } from 'vitest';

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockAuth.currentUser);
    return vi.fn(); // unsubscribe function
  }),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailLink: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(() => false),
};

// Mock Firebase Firestore
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    onSnapshot: vi.fn(),
  })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
};

// Mock Google Auth Provider
export const mockGoogleProvider = vi.fn();

// Helper to set mock authenticated user
export function setMockAuthUser(user) {
  mockAuth.currentUser = user;
}

// Helper to clear mock auth
export function clearMockAuth() {
  mockAuth.currentUser = null;
  vi.clearAllMocks();
}

// Mock Firebase module
vi.mock('@/services/firebaseConfig', () => ({
  auth: mockAuth,
  db: mockFirestore,
  googleProvider: mockGoogleProvider,
}));
