/**
 * Default structure for Property Taxes data
 */

export const FOLDER_TYPES = {
  ASSESSMENT: "assessment",
  PROPERTY_REPORT: "propertyReport",
  TAX_BILL: "taxBill",
  POTENTIAL_TAX_BILLS: "potentialTaxBills",
};

/**
 * Create default folder structure
 */
export const createFolder = () => ({
  pdfs: [], // Array of { name, url, uploadedAt }
  links: [], // Array of { name, url, addedAt }
});

/**
 * Parse tax PINs from semicolon-separated string
 */
export const parseTaxPins = (pinsString) => {
  if (!pinsString) return [];
  return pinsString
    .split(";")
    .map((pin) => pin.trim())
    .filter((pin) => pin.length > 0);
};

/**
 * Convert array of tax PINs to semicolon-separated string
 */
export const formatTaxPins = (pinsArray) => {
  if (!Array.isArray(pinsArray)) return "";
  return pinsArray.filter((pin) => pin).join("; ");
};

/**
 * Default structure for Property Taxes
 */
export const defaultPropertyTaxes = () => ({
  taxPins: [], // Array of PIN strings
  taxAmount: {
    total: 0,
    country: 0,
    municipal: 0,
  },
  size: 0, // Square feet
  folders: {
    [FOLDER_TYPES.ASSESSMENT]: createFolder(),
    [FOLDER_TYPES.PROPERTY_REPORT]: createFolder(),
    [FOLDER_TYPES.TAX_BILL]: createFolder(),
    [FOLDER_TYPES.POTENTIAL_TAX_BILLS]: createFolder(),
  },
});
