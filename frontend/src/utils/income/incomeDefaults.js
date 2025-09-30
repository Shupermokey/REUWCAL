// LEAF_KEYS, newLeaf, defaultStructure

export const LEAF_KEYS = [
  "grossAnnual","psfAnnual","pUnitAnnual",
  "grossMonthly","psfMonthly","pUnitMonthly",
];

export const LEGACY_LEAF_KEYS = [
  "grossAnnual","psfAnnual","pUnitAnnual",    // legacy casing
  "grossMonthly","psfMonthly","pUnitMonthly", // legacy casing
];

// Add unified keys including Rate fields used by the UI
export const newLeaf = () => ({
  grossAnnual: 0, psfAnnual: 0, punitAnnual: 0, rateAnnual: 0,
  grossMonthly: 0, psfMonthly: 0, punitMonthly: 0, rateMonthly: 0,
});

export const defaultStructure = {
  Income: {
    "Gross Scheduled Rent": newLeaf(),
    "Vacancy/Collections Loss": newLeaf(),
    "Less - Free Rent and/or Allowances": newLeaf(),
    "Less - Other Adjustments": newLeaf(),
    "Net Rental Income": newLeaf(),       // (display-only for now)
    "Recoverable Income": newLeaf(),
    "Other Income": newLeaf(),
    "Effective Gross Income": newLeaf(),  // (display-only for now)
  },

  OperatingExpenses: {
    "County-Level Property Taxes": newLeaf(),
    "Municipality-Level Property Taxes": newLeaf(),
    "Other Taxes": newLeaf(),

    "Property Insurance": newLeaf(),
    "Casualty Insurance": newLeaf(),
    "Flood Insurance": newLeaf(),
    "Other Insurance": newLeaf(),

    "Common-Area Utilities": newLeaf(),
    "Common-Area Repairs & Maintenance": newLeaf(),
    "Common-Area Routine Labor": newLeaf(),
    "Other CAM": newLeaf(),

    "Management": newLeaf(),
    "Administrative & Legal": newLeaf(),
    "Other Administrative Expenses": newLeaf(),
  },

  CapitalExpenses: {
    "Financing Expense": newLeaf(),
    "Capital Expenses": newLeaf(),
    "Capital Reserve": newLeaf(),
    "Other": newLeaf(),
  },
};
