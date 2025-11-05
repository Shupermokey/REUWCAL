/**
 * Auto-calculation logic for income statement items
 *
 * Rules:
 * 1. Monthly ↔ Annual: annual = monthly * 12, monthly = annual / 12
 * 2. PSF = Gross / GBA
 * 3. PUnit = Gross / Units
 * 4. When Gross changes, recalc PSF and PUnit
 * 5. When PSF changes, recalc Gross (and then PUnit)
 * 6. When PUnit changes, recalc Gross (and then PSF)
 */

/**
 * Calculate all derived values when a field is edited
 * @param {string} editedField - The field that was just edited
 * @param {number} newValue - The new value for that field
 * @param {object} currentItem - The current item with all values
 * @param {number} gba - Gross Building Area (sq ft)
 * @param {number} units - Number of units
 * @param {boolean} forceNegative - If true, force all values to be negative (for deductions)
 * @returns {object} - Object with all updated field values
 */
export function calculateValues(editedField, newValue, currentItem, gba, units, forceNegative = false) {
  // Force negative if needed
  if (forceNegative && newValue > 0) {
    newValue = -newValue;
  }

  const updates = { [editedField]: newValue };

  // Determine if we're working with monthly or annual
  const isMonthly = editedField.includes("Monthly");
  const isAnnual = editedField.includes("Annual");

  // Extract base field type (rate, gross, psf, punit)
  const baseField = editedField.replace("Monthly", "").replace("Annual", "");

  // Helper to round to 2 decimals
  const round = (n) => Math.round(n * 100) / 100;

  // CASE 1: User edited a Monthly field
  if (isMonthly) {
    // Calculate corresponding Annual value
    const annualField = `${baseField}Annual`;
    updates[annualField] = round(newValue * 12);

    // If Gross was edited, recalculate PSF and PUnit
    if (baseField === "gross") {
      if (gba > 0) {
        updates.psfMonthly = round(newValue / gba);
        updates.psfAnnual = round(updates.grossAnnual / gba);
      }
      if (units > 0) {
        updates.punitMonthly = round(newValue / units);
        updates.punitAnnual = round(updates.grossAnnual / units);
      }
    }

    // If PSF was edited, recalculate Gross (and then PUnit)
    if (baseField === "psf" && gba > 0) {
      updates.grossMonthly = round(newValue * gba);
      updates.grossAnnual = round(updates.grossMonthly * 12);
      if (units > 0) {
        updates.punitMonthly = round(updates.grossMonthly / units);
        updates.punitAnnual = round(updates.grossAnnual / units);
      }
    }

    // If PUnit was edited, recalculate Gross (and then PSF)
    if (baseField === "punit" && units > 0) {
      updates.grossMonthly = round(newValue * units);
      updates.grossAnnual = round(updates.grossMonthly * 12);
      if (gba > 0) {
        updates.psfMonthly = round(updates.grossMonthly / gba);
        updates.psfAnnual = round(updates.grossAnnual / gba);
      }
    }
  }

  // CASE 2: User edited an Annual field
  if (isAnnual) {
    // Calculate corresponding Monthly value
    const monthlyField = `${baseField}Monthly`;
    updates[monthlyField] = round(newValue / 12);

    // If Gross was edited, recalculate PSF and PUnit
    if (baseField === "gross") {
      if (gba > 0) {
        updates.psfAnnual = round(newValue / gba);
        updates.psfMonthly = round(updates.grossMonthly / gba);
      }
      if (units > 0) {
        updates.punitAnnual = round(newValue / units);
        updates.punitMonthly = round(updates.grossMonthly / units);
      }
    }

    // If PSF was edited, recalculate Gross (and then PUnit)
    if (baseField === "psf" && gba > 0) {
      updates.grossAnnual = round(newValue * gba);
      updates.grossMonthly = round(updates.grossAnnual / 12);
      if (units > 0) {
        updates.punitAnnual = round(updates.grossAnnual / units);
        updates.punitMonthly = round(updates.grossMonthly / units);
      }
    }

    // If PUnit was edited, recalculate Gross (and then PSF)
    if (baseField === "punit" && units > 0) {
      updates.grossAnnual = round(newValue * units);
      updates.grossMonthly = round(updates.grossAnnual / 12);
      if (gba > 0) {
        updates.psfAnnual = round(updates.grossAnnual / gba);
        updates.psfMonthly = round(updates.grossMonthly / gba);
      }
    }
  }

  // Rate doesn't auto-calculate anything else (it's standalone)

  return updates;
}

/**
 * Recursively sum all children values
 * Used for parent items that should show the sum of their children
 */
export function sumChildrenValues(item) {
  if (!item.childOrder || item.childOrder.length === 0) {
    // Leaf node - return its own values
    return {
      grossMonthly: item.grossMonthly || 0,
      grossAnnual: item.grossAnnual || 0,
      rateMonthly: item.rateMonthly || 0,
      rateAnnual: item.rateAnnual || 0,
      psfMonthly: item.psfMonthly || 0,
      psfAnnual: item.psfAnnual || 0,
      punitMonthly: item.punitMonthly || 0,
      punitAnnual: item.punitAnnual || 0,
    };
  }

  // Has children - sum them up
  const totals = {
    grossMonthly: 0,
    grossAnnual: 0,
    rateMonthly: 0,
    rateAnnual: 0,
    psfMonthly: 0,
    psfAnnual: 0,
    punitMonthly: 0,
    punitAnnual: 0,
  };

  item.childOrder.forEach((childId) => {
    const child = item.children[childId];
    if (child) {
      const childTotals = sumChildrenValues(child);
      Object.keys(totals).forEach((key) => {
        totals[key] += childTotals[key];
      });
    }
  });

  return totals;
}

/**
 * Calculate Net Rental Income (NRI)
 * NRI = Gross Scheduled Rent + all items between GSR and NRI (deductions)
 *
 * @param {object} sectionData - The Income section data with order and items
 * @returns {object} - Calculated values for NRI
 */
export function calculateNetRentalIncome(sectionData) {
  const { order = [], items = {} } = sectionData;

  const gsrIndex = order.indexOf("gsr");
  const nriIndex = order.indexOf("nri");

  // If either is missing, return zeros
  if (gsrIndex === -1 || nriIndex === -1) {
    return {
      grossMonthly: 0,
      grossAnnual: 0,
      rateMonthly: 0,
      rateAnnual: 0,
      psfMonthly: 0,
      psfAnnual: 0,
      punitMonthly: 0,
      punitAnnual: 0,
    };
  }

  // Sum all items from GSR to (but not including) NRI
  const totals = {
    grossMonthly: 0,
    grossAnnual: 0,
    rateMonthly: 0,
    rateAnnual: 0,
    psfMonthly: 0,
    psfAnnual: 0,
    punitMonthly: 0,
    punitAnnual: 0,
  };

  for (let i = gsrIndex; i < nriIndex; i++) {
    const itemId = order[i];
    const item = items[itemId];
    if (item) {
      // Get values (including summed children if any)
      const itemValues = sumChildrenValues(item);
      Object.keys(totals).forEach((key) => {
        totals[key] += itemValues[key];
      });
    }
  }

  return totals;
}
