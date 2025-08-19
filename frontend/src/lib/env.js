const need = (k) => {
  const v = import.meta.env[k];
  if (!v || String(v).trim() === '') throw new Error(`Missing required env var: ${k}`);
  return v;
};

export const env = {
  FIREBASE_API_KEY: need('VITE_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: need('VITE_FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: need('VITE_FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: need('VITE_FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: need('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: need('VITE_FIREBASE_APP_ID'),
  STRIPE_PUBLISHABLE_KEY: need('VITE_STRIPE_PUBLISHABLE_KEY'),
};
