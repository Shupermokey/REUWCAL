// src/config/index.js
export const CONFIG = Object.freeze({
  ENV: import.meta.env.MODE,
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  DEFAULT_CURRENCY: "USD",
  LOG_LEVEL: import.meta.env.DEV ? "debug" : "warn",
});
