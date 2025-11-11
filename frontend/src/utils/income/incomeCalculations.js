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
 * Check if an item is the Vacancy/Collections Loss item
 * @param {object} currentItem - The item to check
 * @returns {boolean} - True if this is the vacancy item
 */
function isVacancyItem(currentItem) {
  // Check for common vacancy identifiers
  const id = currentItem.id?.toLowerCase() || "";
  const label = currentItem.label?.toLowerCase() || "";
  return id.includes("vacancy") || label.includes("vacancy");
}

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
  const isVacancy = isVacancyItem(currentItem);

  // For Rate fields: convert to percentage (0-100) and ensure non-negative
  const isRateField = editedField.includes("rate");
  if (isRateField && newValue < 0) {
    newValue = Math.abs(newValue); // Rate cannot be negative
  }

  // Force negative if needed (but not for rate fields on vacancy items)
  if (forceNegative && newValue > 0 && !isRateField) {
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

  // Helper to round to 4 decimals (for rates)
  const roundRate = (n) => Math.round(n * 10000) / 10000;

  // SPECIAL CASE: Vacancy item - Rate is editable and drives Gross calculation
  if (isVacancy && baseField === "rate") {
    // Rate changed on vacancy - need to recalculate Gross based on parent GSR's Gross
    // For now, we just sync the rate between monthly and annual
    // The actual Gross calculation will happen in the component level
    if (isMonthly) {
      updates.rateAnnual = roundRate(newValue); // Rate is same for monthly/annual
    } else if (isAnnual) {
      updates.rateMonthly = roundRate(newValue); // Rate is same for monthly/annual
    }
    return updates; // Exit early - Gross will be calculated by component
  }

  // CASE 1: User edited a Monthly field
  if (isMonthly) {
    // Calculate corresponding Annual value
    const annualField = `${baseField}Annual`;
    updates[annualField] = baseField === "rate" ? roundRate(newValue) : round(newValue * 12);

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
    updates[monthlyField] = baseField === "rate" ? roundRate(newValue) : round(newValue / 12);

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

  // Rate doesn't auto-calculate anything else (it's standalone for non-vacancy items)

  return updates;
}

/**
 * Helper: Check if an item is the Vacancy/Collections Loss item (exported for use in components)
 */
export { isVacancyItem };

/**
 * Recursively sum all children values
 * Used for parent items that should show the sum of their children
 * Excludes subtotal rows from the sum
 */
export function sumChildrenValues(item) {
  if (!item.childOrder || item.childOrder.length === 0) {
    // Leaf node - return its own values (unless it's a subtotal)
    if (item.isSubtotal) {
      // If this is a subtotal, return zeros (it shouldn't contribute to parent sums)
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

  // Has children - sum them up (excluding subtotals)
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
    if (child && !child.isSubtotal) {
      // Skip subtotal children in the sum
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
