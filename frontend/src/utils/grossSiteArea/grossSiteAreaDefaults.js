/**
 * Default structure for Gross Site Area data
 */

// Conversion constant
export const SQFT_PER_ACRE = 43560;

/**
 * Create default folder structure
 */
export const createFolder = () => ({
  pdfs: [], // Array of { name, url, uploadedAt }
  links: [], // Array of { name, url, addedAt }
});

/**
 * Convert acres to square feet
 */
export const acresToSqFt = (acres) => {
  return acres * SQFT_PER_ACRE;
};

/**
 * Convert square feet to acres
 */
export const sqFtToAcres = (sqFt) => {
  return sqFt / SQFT_PER_ACRE;
};

/**
 * Round to reasonable precision
 */
export const roundArea = (value, isAcres = false) => {
  // Acres: 4 decimal places
  // SqFt: 2 decimal places
  const decimals = isAcres ? 4 : 2;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Default structure for Gross Site Area
 */
export const defaultGrossSiteArea = () => ({
  acres: 0,
  squareFeet: 0,
  primaryUnit: "acres", // "acres" or "squareFeet"
  propertySurvey: createFolder(),
});
