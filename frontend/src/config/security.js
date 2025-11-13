/**
 * Security Configuration
 * Centralized security settings and helpers
 */

import { RateLimiter } from '@/utils/validation';

// ═══════════════════════════════════════════════════════════════
// RATE LIMITERS
// ═══════════════════════════════════════════════════════════════

// Rate limiter for authentication attempts (10 attempts per 15 minutes)
export const authRateLimiter = new RateLimiter(10, 15 * 60 * 1000);

// Rate limiter for API calls (100 requests per minute)
export const apiRateLimiter = new RateLimiter(100, 60 * 1000);

// Rate limiter for file uploads (10 uploads per 5 minutes)
export const uploadRateLimiter = new RateLimiter(10, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// CONTENT SECURITY POLICY
// ═══════════════════════════════════════════════════════════════

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React
    "'unsafe-eval'", // Required for dev tools
    'https://apis.google.com',
    'https://www.gstatic.com',
    'https://*.stripe.com',
    'https://*.sentry.io',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'https://firestore.googleapis.com',
    'wss://*.firebaseio.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://api.stripe.com',
    'https://*.sentry.io',
    'https://*.google-analytics.com',
  ],
  'frame-src': ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// ═══════════════════════════════════════════════════════════════
// ALLOWED FILE TYPES
// ═══════════════════════════════════════════════════════════════

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'text/plain',
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

// ═══════════════════════════════════════════════════════════════
// FILE SIZE LIMITS (in bytes)
// ═══════════════════════════════════════════════════════════════

export const MAX_FILE_SIZES = {
  profileImage: 5 * 1024 * 1024, // 5 MB
  propertyImage: 10 * 1024 * 1024, // 10 MB
  document: 20 * 1024 * 1024, // 20 MB
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION RULES
// ═══════════════════════════════════════════════════════════════

export const VALIDATION_RULES = {
  // User input
  email: {
    minLength: 3,
    maxLength: 254, // RFC 5321
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireLowercase: true,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true,
  },
  name: {
    minLength: 1,
    maxLength: 100,
  },

  // Property data
  propertyName: {
    minLength: 1,
    maxLength: 200,
  },
  propertyAddress: {
    minLength: 0,
    maxLength: 500,
  },
  grossBuildingArea: {
    min: 0,
    max: 10000000, // 10 million sq ft
  },
  units: {
    min: 0,
    max: 10000,
  },

  // Income statement
  rowLabel: {
    minLength: 1,
    maxLength: 200,
  },
  rowValue: {
    min: -1000000000, // -1 billion
    max: 1000000000, // 1 billion
  },

  // Baseline
  baselineName: {
    minLength: 1,
    maxLength: 200,
  },
};

// ═══════════════════════════════════════════════════════════════
// SANITIZATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file) {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

/**
 * Check if file size is within limit
 */
export function isAllowedFileSize(file, maxSize) {
  return file.size <= maxSize;
}

/**
 * Validate file for upload
 */
export function validateFile(file, type = 'document') {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  // Check file type
  if (!isAllowedFileType(file)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.document;
  if (!isAllowedFileSize(file, maxSize)) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)} MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════
// SECURITY MONITORING
// ═══════════════════════════════════════════════════════════════

/**
 * Log security event
 */
export function logSecurityEvent(eventType, details = {}) {
  if (import.meta.env.DEV) {
    console.warn('🔒 Security Event:', eventType, details);
  }

  // In production, send to analytics/monitoring
  if (import.meta.env.PROD) {
    // Send to Sentry or analytics
    try {
      // @ts-ignore
      if (window.Sentry) {
        window.Sentry.captureMessage(`Security Event: ${eventType}`, {
          level: 'warning',
          extra: details,
        });
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

/**
 * Detect and prevent common attacks
 */
export function detectSuspiciousActivity(input) {
  if (typeof input !== 'string') return false;

  const suspiciousPatterns = [
    /<script/i, // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i, // Event handlers
    /\.\.\//, // Path traversal
    /union.*select/i, // SQL injection
    /exec\s*\(/i, // Code execution
    /eval\s*\(/i, // Code evaluation
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(input));

  if (isSuspicious) {
    logSecurityEvent('suspicious_input', {
      input: input.slice(0, 100), // Log first 100 chars only
      patterns: suspiciousPatterns
        .filter((pattern) => pattern.test(input))
        .map((pattern) => pattern.toString()),
    });
  }

  return isSuspicious;
}

// ═══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Session timeout (15 minutes of inactivity)
 */
export const SESSION_TIMEOUT = 15 * 60 * 1000;

/**
 * Session checker
 */
export class SessionManager {
  constructor(timeout = SESSION_TIMEOUT) {
    this.timeout = timeout;
    this.lastActivity = Date.now();
    this.warningCallback = null;
    this.expireCallback = null;
    this.checkInterval = null;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Check if session is expired
   */
  isExpired() {
    return Date.now() - this.lastActivity > this.timeout;
  }

  /**
   * Get time until session expires
   */
  getTimeUntilExpiry() {
    return Math.max(0, this.timeout - (Date.now() - this.lastActivity));
  }

  /**
   * Start monitoring session
   */
  startMonitoring(warningCallback, expireCallback) {
    this.warningCallback = warningCallback;
    this.expireCallback = expireCallback;

    // Check every minute
    this.checkInterval = setInterval(() => {
      const timeLeft = this.getTimeUntilExpiry();

      // Warn at 2 minutes remaining
      if (timeLeft <= 2 * 60 * 1000 && timeLeft > 0 && this.warningCallback) {
        this.warningCallback(timeLeft);
      }

      // Expire session
      if (this.isExpired() && this.expireCallback) {
        this.expireCallback();
        this.stopMonitoring();
      }
    }, 60 * 1000);

    // Update activity on user interaction
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, () => this.updateActivity());
    });
  }

  /**
   * Stop monitoring session
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  VALIDATION_RULES,
  isAllowedFileType,
  isAllowedFileSize,
  validateFile,
  logSecurityEvent,
  detectSuspiciousActivity,
  SessionManager,
  SESSION_TIMEOUT,
};
