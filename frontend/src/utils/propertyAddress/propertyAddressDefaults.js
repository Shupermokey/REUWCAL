/**
 * Default structure for Property Address data
 */

export const ZONING_CATEGORIES = {
  COMMERCIAL: "Commercial",
  RESIDENTIAL: "Residential",
};

export const COMMERCIAL_SUBTYPES = [
  "Office",
  "Industrial",
  "Retail",
  "Special Use",
  "OTHER",
];

export const RESIDENTIAL_SUBTYPES = [
  "Single Family",
  "Multi Family",
  "Mixed Use",
  "OTHER",
];

export const FOLDER_TYPES = {
  ZONING_MAP: "zoningMap",
  ZONING_ORDINANCE: "zoningOrdinance",
  FEMA: "fema",
  MARKETING: "marketing",
  MSA: "msa",
  DEMOGRAPHICS: "demographics",
  TRAFFIC_PATTERNS: "trafficPatterns",
  PROPERTY_REPORTS: "propertyReports",
  CORPORATE_GOVERNANCE: "corporateGovernance",
};

/**
 * Create default folder structure
 */
export const createFolder = () => ({
  pdfs: [], // Array of { name, url, uploadedAt }
  links: [], // Array of { name, url, addedAt }
});

/**
 * Create default FEMA data
 */
export const createFemaData = () => ({
  femaId: "",
  tileId: "",
  dateOfGeneration: "",
  folder: createFolder(),
});

/**
 * Create default zoning data
 */
export const createZoningData = () => ({
  category: ZONING_CATEGORIES.RESIDENTIAL, // Default to Residential
  subtype: "Single Family", // Default subtype
  customSubtype: "", // For "OTHER" option
  code: "",
  zoningMap: createFolder(),
  zoningOrdinance: createFolder(),
});

/**
 * Default structure for Property Address
 */
export const defaultPropertyAddress = () => ({
  propertyAddress: "",
  propertyTitle: "",
  zoning: createZoningData(),
  floodZone: createFemaData(),
  folders: {
    [FOLDER_TYPES.MARKETING]: createFolder(),
    [FOLDER_TYPES.MSA]: createFolder(),
    [FOLDER_TYPES.DEMOGRAPHICS]: createFolder(),
    [FOLDER_TYPES.TRAFFIC_PATTERNS]: createFolder(),
    [FOLDER_TYPES.PROPERTY_REPORTS]: createFolder(),
    [FOLDER_TYPES.CORPORATE_GOVERNANCE]: createFolder(),
  },
});
