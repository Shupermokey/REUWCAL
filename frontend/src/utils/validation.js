/**
 * Input Validation and Sanitization Utilities
 * Provides secure input validation and sanitization functions
 */

// ═══════════════════════════════════════════════════════════════
// SANITIZATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(dirty) {
  if (typeof dirty !== 'string') return '';

  // Remove script tags and their content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  clean = clean.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  clean = clean.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  clean = clean.replace(/data:text\/html/gi, '');

  return clean;
}

/**
 * Sanitize user input for database storage
 * Trims whitespace and removes null bytes
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') return '';

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Allow only alphanumeric, dot, dash, underscore
    .replace(/\.{2,}/g, '_') // Prevent path traversal with ..
    .replace(/^\./, '_') // Remove leading dot
    .slice(0, 255); // Limit length
}

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') return '';

  // Only allow http and https protocols
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    // If not a valid URL, check if it's a relative path
    if (url.startsWith('/')) {
      return url;
    }
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Validate email address
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

/**
 * Validate password strength
 * Returns: { isValid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = [];

  if (typeof password !== 'string') {
    return { isValid: false, errors: ['Password must be a string'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate string length
 */
export function isValidLength(str, min = 0, max = Infinity) {
  if (typeof str !== 'string') return false;
  return str.length >= min && str.length <= max;
}

/**
 * Validate number range
 */
export function isValidNumber(num, min = -Infinity, max = Infinity) {
  if (typeof num !== 'number' || isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate property data
 */
export function validatePropertyData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid property data'] };
  }

  // Validate name
  if (!data.name || !isValidLength(data.name, 1, 200)) {
    errors.push('Property name must be between 1 and 200 characters');
  }

  // Validate address (optional)
  if (data.address && !isValidLength(data.address, 0, 500)) {
    errors.push('Address must be less than 500 characters');
  }

  // Validate numeric fields
  if (data.grossBuildingAreaSqFt !== undefined) {
    if (!isValidNumber(data.grossBuildingAreaSqFt, 0, 10000000)) {
      errors.push('Gross building area must be between 0 and 10,000,000 sq ft');
    }
  }

  if (data.units !== undefined) {
    if (!isValidNumber(data.units, 0, 10000)) {
      errors.push('Units must be between 0 and 10,000');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate income statement row data
 */
export function validateRowData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid row data'] };
  }

  // Validate label
  if (!data.label || !isValidLength(data.label, 1, 200)) {
    errors.push('Row label must be between 1 and 200 characters');
  }

  // Validate numeric values (if present)
  const numericFields = ['value', 'amount', 'total'];
  numericFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!isValidNumber(data[field], -1000000000, 1000000000)) {
        errors.push(`${field} must be between -1,000,000,000 and 1,000,000,000`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate baseline data
 */
export function validateBaselineData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid baseline data'] };
  }

  // Validate name
  if (!data.name || !isValidLength(data.name, 1, 200)) {
    errors.push('Baseline name must be between 1 and 200 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Simple client-side rate limiter
 * Prevents excessive API calls
 */
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // milliseconds
    this.requests = [];
  }

  /**
   * Check if request is allowed
   */
  isAllowed() {
    const now = Date.now();

    // Remove old requests outside the time window
    this.requests = this.requests.filter((time) => now - time < this.timeWindow);

    // Check if under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilReset() {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.timeWindow - (Date.now() - oldestRequest);
    return Math.max(0, timeUntilReset);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT DEFAULT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const validators = {
  sanitizeHTML,
  sanitizeInput,
  sanitizeFilename,
  sanitizeURL,
  isValidEmail,
  validatePassword,
  isValidLength,
  isValidNumber,
  validatePropertyData,
  validateRowData,
  validateBaselineData,
  RateLimiter,
};

export default validators;
