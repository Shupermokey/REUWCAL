import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import * as Sentry from '@sentry/react';

// Get app from firebaseConfig - we'll create it if needed
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig, 'analytics-app');

let analytics = null;

/**
 * Initialize Firebase Analytics
 */
export function initAnalytics() {
  // Only initialize in production or if explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    try {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
      Sentry.captureException(error);
    }
  } else {
    console.log('ℹ️ Firebase Analytics disabled in development');
  }
}

/**
 * Track page view
 */
export function trackPageView(pagePath, pageTitle) {
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

/**
 * Track custom event
 */
export function trackEvent(eventName, eventParams = {}) {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error(`Failed to track event "${eventName}":`, error);
  }
}

/**
 * Track user action (click, form submit, etc.)
 */
export function trackUserAction(action, category, label = null, value = null) {
  if (!analytics) return;

  try {
    logEvent(analytics, action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch (error) {
    console.error(`Failed to track user action "${action}":`, error);
  }
}

/**
 * Set user ID for analytics
 */
export function setAnalyticsUser(userId) {
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Failed to set analytics user:', error);
  }
}

/**
 * Set user properties for analytics
 */
export function setAnalyticsUserProperties(properties) {
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
}

// Predefined event trackers
export const Analytics = {
  // Authentication events
  auth: {
    login: (method) => trackEvent('login', { method }),
    signup: (method) => trackEvent('sign_up', { method }),
    logout: () => trackEvent('logout'),
  },

  // Subscription events
  subscription: {
    view: (plan) => trackEvent('view_subscription', { plan }),
    select: (plan) => trackEvent('select_subscription', { plan }),
    purchase: (plan, value) => trackEvent('purchase', { plan, value, currency: 'USD' }),
    cancel: (plan) => trackEvent('cancel_subscription', { plan }),
  },

  // Property events
  property: {
    create: () => trackEvent('create_property'),
    update: (propertyId) => trackEvent('update_property', { property_id: propertyId }),
    delete: (propertyId) => trackEvent('delete_property', { property_id: propertyId }),
    view: (propertyId) => trackEvent('view_property', { property_id: propertyId }),
  },

  // Income statement events
  income: {
    create: (propertyId) => trackEvent('create_income_statement', { property_id: propertyId }),
    update: (propertyId) => trackEvent('update_income_statement', { property_id: propertyId }),
    save: (propertyId) => trackEvent('save_income_statement', { property_id: propertyId }),
  },

  // Error tracking
  error: (message, fatal = false) => trackEvent('exception', { description: message, fatal }),
};
