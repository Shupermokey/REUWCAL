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
 * Create a unit type entry (header group)
 */
export const createUnitType = () => ({
  unitType: "", // e.g., "Studio", "1BR", "2BR"
  count: 0, // Number of units
  avgSqFt: 0, // Average square footage
  avgRent: 0, // Average monthly rent
});

/**
 * Create a single unit with all fields
 */
export const createUnit = (id = null) => ({
  id: id || `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Unit Information
  unitId: "",           // Unit identifier (e.g., "101", "A1")
  unitDesc: "",         // Unit description
  leaseAbstract: "",    // Lease abstract notes
  tenant: "",           // Tenant name
  sqft: 0,              // Unit size in sq ft

  // Unit Income Information
  percentIncreaseRent: 3,         // Default 3% annual increase
  rentPsf: 0,                     // Rent per sq ft
  rentMonthly: 0,                 // Rent per month
  rentAnnual: 0,                  // Rent per annual
  percentIncreaseRecoverable: 0,  // % Increase for recoverable rent
  recoverableRentPsf: 0,          // Recoverable rent per sq ft
  recoverableRentMonthly: 0,      // Recoverable rent per month
  recoverableRentAnnual: 0,       // Recoverable rent per annual
  grossRentPsf: 0,                // Gross rent per sq ft
  grossRentMonthly: 0,            // Gross rent per month
  grossRentAnnual: 0,             // Gross rent per annual

  // Lease Information
  leaseStart: "",       // Lease term start date
  leaseEnd: "",         // Lease term end date
  waltMonthly: 0,       // WALT in months
  waltAnnual: 0,        // WALT in years

  // Yearly breakdown (auto-generated from lease dates)
  yearlyBreakdown: [],  // Array of { year, rentMonthly, rentAnnual, percentIncrease }
  yearlyExpanded: false, // Whether yearly breakdown is expanded

  // Legacy fields for backward compatibility
  name: "",             // Maps to unitId
  rent: 0,              // Maps to rentMonthly
  linkedIncomeStatementRowId: null,
});

/**
 * Generate yearly breakdown from lease dates with rent increases
 */
export const generateYearlyBreakdown = (leaseStart, leaseEnd, baseRentMonthly, percentIncrease = 3) => {
  if (!leaseStart || !leaseEnd) return [];

  let startYear, endYear;

  // Handle year-only inputs (e.g., 2026 or "2026")
  const startNum = parseInt(leaseStart, 10);
  const endNum = parseInt(leaseEnd, 10);

  if (!isNaN(startNum) && startNum > 1900 && startNum < 3000 && String(leaseStart).length === 4) {
    startYear = startNum;
  } else {
    // Parse the date string manually to avoid timezone issues
    // Expected formats: "MM/DD/YYYY", "YYYY-MM-DD", or similar
    const startStr = String(leaseStart);
    let start;

    // Check for MM/DD/YYYY format
    const slashMatch = startStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      startYear = parseInt(slashMatch[3], 10);
    } else {
      // Fall back to Date parsing with UTC to avoid timezone issues
      start = new Date(leaseStart);
      if (isNaN(start.getTime())) return [];
      startYear = start.getUTCFullYear();
    }
  }

  if (!isNaN(endNum) && endNum > 1900 && endNum < 3000 && String(leaseEnd).length === 4) {
    endYear = endNum;
  } else {
    // Parse the date string manually to avoid timezone issues
    const endStr = String(leaseEnd);
    let end;

    // Check for MM/DD/YYYY format
    const slashMatch = endStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      endYear = parseInt(slashMatch[3], 10);
    } else {
      // Fall back to Date parsing with UTC to avoid timezone issues
      end = new Date(leaseEnd);
      if (isNaN(end.getTime())) return [];
      endYear = end.getUTCFullYear();
    }
  }

  const years = [];
  let currentRent = baseRentMonthly;

  for (let year = startYear; year <= endYear; year++) {
    // Apply percentage increase after first year
    if (year > startYear) {
      currentRent = currentRent * (1 + percentIncrease / 100);
    }

    years.push({
      year,
      rentMonthly: Math.round(currentRent * 100) / 100,
      rentAnnual: Math.round(currentRent * 12 * 100) / 100,
      percentIncrease: year === startYear ? 0 : percentIncrease,
    });
  }

  return years;
};

/**
 * Calculate WALT (Weighted Average Lease Term) for a unit
 * Returns { monthly, annual }
 */
export const calculateWALT = (leaseEnd) => {
  if (!leaseEnd) return { monthly: 0, annual: 0 };

  const end = new Date(leaseEnd);
  const now = new Date();

  if (isNaN(end.getTime())) return { monthly: 0, annual: 0 };

  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return { monthly: 0, annual: 0 };

  const months = diffMs / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
  const years = months / 12;

  return {
    monthly: Math.round(months * 10) / 10,
    annual: Math.round(years * 100) / 100,
  };
};

/**
 * Calculate unit size as percentage of GBA
 */
export const calculatePercentOfGBA = (unitSqFt, gba) => {
  if (!gba || gba === 0) return 0;
  return Math.round((unitSqFt / gba) * 10000) / 100; // Returns percentage with 2 decimals
};

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
