// src/analytics/index.js
import { ANALYTIC_EVENTS } from "./events";

export const logEvent = (event, payload = {}) => {
  // Placeholder for Firebase Analytics, PostHog, or console
  if (import.meta.env.DEV) {
    console.info("[Analytics]", event, payload);
  } else {
    // Example: analytics().logEvent(event, payload);
  }
};

export { ANALYTIC_EVENTS };
