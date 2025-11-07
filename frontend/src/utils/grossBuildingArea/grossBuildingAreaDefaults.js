/**
 * Default structure for Gross Building Area data
 */

export const FOLDER_TYPES = {
  FLOOR_PLANS: "floorPlans",
  OTHER: "other",
};

/**
 * Create default folder structure
 */
export const createFolder = () => ({
  pdfs: [], // Array of { name, url, uploadedAt }
  links: [], // Array of { name, url, addedAt }
});

/**
 * Default structure for Gross Building Area
 */
export const defaultGrossBuildingArea = () => ({
  gba: 0, // Gross Building Area (required)
  gla: 0, // Gross Living Area
  nra: 0, // Net Rentable Area
  folders: {
    [FOLDER_TYPES.FLOOR_PLANS]: createFolder(),
    [FOLDER_TYPES.OTHER]: createFolder(),
  },
});
