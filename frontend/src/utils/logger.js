// src/utils/logger.js
export const log = {
  info: (...args) => import.meta.env.DEV && console.info("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  debug: (...args) => import.meta.env.DEV && console.debug("[DEBUG]", ...args),
};
