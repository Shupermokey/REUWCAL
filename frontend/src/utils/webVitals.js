import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import * as Sentry from '@sentry/react';
import { trackEvent } from '@/config/analytics';

/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends to analytics and monitoring services
 */

/**
 * Send metric to analytics and monitoring
 */
function sendToAnalytics({ name, value, rating, id, navigationType }) {
  const metric = {
    name,
    value: Math.round(name === 'CLS' ? value * 1000 : value), // CLS is fractional
    rating,
    id,
    navigationType,
  };

  // Send to Firebase Analytics
  trackEvent('web_vital', metric);

  // Send to Sentry as measurement
  Sentry.setMeasurement(name, value, 'millisecond');

  // Log in development
  if (import.meta.env.DEV) {
    console.log('📊 Web Vital:', metric);
  }

  // Send to custom analytics endpoint if configured
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch((error) => {
      console.error('Failed to send web vital to analytics:', error);
    });
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals() {
  // Only track in production or if explicitly enabled
  if (!import.meta.env.PROD && import.meta.env.VITE_ENABLE_WEB_VITALS !== 'true') {
    console.log('ℹ️ Web Vitals tracking disabled in development');
    return;
  }

  // Cumulative Layout Shift (CLS)
  // Measures visual stability
  // Good: < 0.1, Needs improvement: 0.1-0.25, Poor: > 0.25
  onCLS(sendToAnalytics);

  // Interaction to Next Paint (INP) - replaces FID
  // Measures overall interactivity
  // Good: < 200ms, Needs improvement: 200-500ms, Poor: > 500ms
  onINP(sendToAnalytics);

  // First Contentful Paint (FCP)
  // Measures perceived load speed
  // Good: < 1.8s, Needs improvement: 1.8-3s, Poor: > 3s
  onFCP(sendToAnalytics);

  // Largest Contentful Paint (LCP)
  // Measures loading performance
  // Good: < 2.5s, Needs improvement: 2.5-4s, Poor: > 4s
  onLCP(sendToAnalytics);

  // Time to First Byte (TTFB)
  // Measures server response time
  // Good: < 800ms, Needs improvement: 800-1800ms, Poor: > 1800ms
  onTTFB(sendToAnalytics);

  console.log('✅ Web Vitals monitoring initialized');
}

/**
 * Helper to check if metrics meet thresholds
 */
export function getWebVitalsScore() {
  // This would typically aggregate stored metrics
  // For now, just a placeholder
  return {
    cls: 'unknown',
    fid: 'unknown',
    inp: 'unknown',
    fcp: 'unknown',
    lcp: 'unknown',
    ttfb: 'unknown',
  };
}
