// src/constants/appConfig.js
export const APP_CONFIG = Object.freeze({
  APP_NAME: "ReUWCAL",
  VERSION: "1.0.0",
  DEBUG: import.meta.env.MODE !== "production",
  DEFAULT_CURRENCY: "USD",
  MAX_PROPERTIES_PER_USER: 50,
  MAX_BASELINES_PER_USER: 25,
  MAX_FILE_UPLOAD_SIZE_MB: 50,
});
