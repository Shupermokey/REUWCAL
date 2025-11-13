import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  // Only initialize Sentry in production or if explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,

      environment: import.meta.env.VITE_ENVIRONMENT || 'development',

      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      // In production, you'll want to lower this (e.g., 0.1 for 10%)
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Set replays sample rate
      // Session Replay helps you debug issues by replaying user sessions
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
      replaysOnErrorSampleRate: 1.0, // Always replay sessions with errors

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration({
          // Set `tracePropagationTargets` to control what URLs trace propagation applies to
          tracePropagationTargets: [
            "localhost",
            /^https:\/\/yourapp\.com/,
            /^https:\/\/staging\.yourapp\.com/,
          ],
        }),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Filter out low-priority errors
      beforeSend(event, hint) {
        // Don't send errors in development unless explicitly enabled
        if (!import.meta.env.PROD && import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
          return null;
        }

        // Filter out Firebase auth errors (expected in some cases)
        if (event.exception?.values?.[0]?.type === 'FirebaseError') {
          const message = event.exception.values[0].value;
          if (message?.includes('auth/') || message?.includes('permission-denied')) {
            return null; // Don't send to Sentry
          }
        }

        return event;
      },

      // Release tracking
      release: import.meta.env.VITE_RELEASE_VERSION,
    });

    console.log('✅ Sentry initialized');
  } else {
    console.log('ℹ️ Sentry disabled in development');
  }
}

/**
 * Helper to manually capture exceptions
 */
export function captureException(error, context) {
  Sentry.captureException(error, {
    contexts: context,
  });
}

/**
 * Helper to set user context
 */
export function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.uid,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Helper to add breadcrumb (for debugging)
 */
export function addBreadcrumb(message, data) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}
