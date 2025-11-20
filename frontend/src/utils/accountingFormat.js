/**
 * Accounting Number Format Utilities
 * Formats numbers in standard accounting style:
 * - Thousands separators (commas)
 * - Two decimal places for currency
 * - Negative numbers in parentheses
 * - Currency symbols where appropriate
 */

/**
 * Format a number in accounting style
 * @param {number|string} value - The number to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showCurrency - Whether to show $ symbol
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @param {boolean} options.showParens - Whether to show negatives in parentheses (default: true)
 * @returns {string} Formatted number string
 */
export const formatAccounting = (value, options = {}) => {
  const {
    showCurrency = false,
    decimals = 2,
    showParens = true,
  } = options;

  // Handle empty/null/undefined
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  // Parse the value
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN
  if (isNaN(num)) {
    return '';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Format with commas and decimals
  const formatted = absNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Build the result
  let result = formatted;

  if (showCurrency) {
    result = '$' + result;
  }

  if (isNegative && showParens) {
    result = '(' + result + ')';
  } else if (isNegative) {
    result = '-' + result;
  }

  return result;
};

/**
 * Parse an accounting-formatted string back to a number
 * @param {string} value - The formatted string to parse
 * @returns {number} The parsed number
 */
export const parseAccounting = (value) => {
  if (!value || typeof value !== 'string') {
    return typeof value === 'number' ? value : 0;
  }

  // Remove currency symbols, commas, and spaces
  let cleaned = value.replace(/[$,\s]/g, '');

  // Check for parentheses (negative number)
  const isNegative = cleaned.includes('(') && cleaned.includes(')');
  cleaned = cleaned.replace(/[()]/g, '');

  const num = parseFloat(cleaned) || 0;
  return isNegative ? -num : num;
};

/**
 * Format for display in an input field (without currency symbol for easier editing)
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatForInput = (value, decimals = 2) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (isNegative) {
    return '(' + formatted + ')';
  }

  return formatted;
};

/**
 * Format a percentage value
 * @param {number|string} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '';
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
