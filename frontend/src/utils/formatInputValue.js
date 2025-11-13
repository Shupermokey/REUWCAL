/**
 * Format a numeric value for display in an input field
 * Returns empty string for 0, null, undefined, or empty values
 * This prevents showing "0" in inputs and allows clean typing
 *
 * @param {number|string|null|undefined} value - The value to format
 * @returns {string} - Empty string if falsy/zero, otherwise the string value
 */
export function formatInputValue(value) {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === "") {
    return "";
  }

  // Convert to number and check if it's 0
  const numValue = typeof value === "number" ? value : parseFloat(value);

  if (isNaN(numValue) || numValue === 0) {
    return "";
  }

  return value.toString();
}

/**
 * Parse input value to number
 * Returns 0 for empty strings to maintain data consistency
 *
 * @param {string} value - The input value
 * @returns {number} - Parsed number or 0
 */
export function parseInputValue(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
