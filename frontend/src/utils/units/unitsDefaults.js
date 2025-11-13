/**
 * Default structure for Units data
 */

export const FOLDER_TYPES = {
  UNIT_FLOOR_PLANS: "unitFloorPlans",
};

/**
 * Create default folder structure
 */
export const createFolder = () => ({
  pdfs: [], // Array of { name, url, uploadedAt }
  links: [], // Array of { name, url, addedAt }
});

/**
 * Create a unit type entry
 */
export const createUnitType = () => ({
  unitType: "", // e.g., "Studio", "1BR", "2BR"
  count: 0, // Number of units
  avgSqFt: 0, // Average square footage
  avgRent: 0, // Average monthly rent
});

/**
 * Calculate total units from unit mix
 */
export const calculateTotalUnits = (unitMix = []) => {
  return unitMix.reduce((total, unit) => total + (unit.count || 0), 0);
};

/**
 * Calculate weighted average square footage
 */
export const calculateAvgSqFt = (unitMix = []) => {
  const totalUnits = calculateTotalUnits(unitMix);
  if (totalUnits === 0) return 0;

  const totalSqFt = unitMix.reduce((sum, unit) => {
    return sum + (unit.count || 0) * (unit.avgSqFt || 0);
  }, 0);

  return Math.round(totalSqFt / totalUnits);
};

/**
 * Calculate weighted average rent
 */
export const calculateAvgRent = (unitMix = []) => {
  const totalUnits = calculateTotalUnits(unitMix);
  if (totalUnits === 0) return 0;

  const totalRent = unitMix.reduce((sum, unit) => {
    return sum + (unit.count || 0) * (unit.avgRent || 0);
  }, 0);

  return Math.round(totalRent / totalUnits);
};

/**
 * Default structure for Units
 */
export const defaultUnits = () => ({
  unitMix: [createUnitType()], // Array of unit types
  rentRoll: {
    totalMonthlyRent: 0,
    occupancyRate: 100, // Percentage
  },
  folders: {
    [FOLDER_TYPES.UNIT_FLOOR_PLANS]: createFolder(),
  },
});
