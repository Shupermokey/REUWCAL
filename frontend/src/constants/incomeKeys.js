// ---------------------------------------------------------------------------
// Core leaf fields
// ---------------------------------------------------------------------------
export const LEAF_KEYS = [
  "grossAnnual",
  "psfAnnual",
  "punitAnnual",
  "rateAnnual",
  "grossMonthly",
  "psfMonthly",
  "punitMonthly",
  "rateMonthly",
];

// src/constants/income/opexGroups.js
// ---------------------------------------------------------------------------
// 🧩 Operating Expense Sub-Groups
// ---------------------------------------------------------------------------

export const TAX_KEYS = Object.freeze([
  "County-Level Property Taxes",
  "Municipality-Level Property Taxes",
  "Other Taxes",
]);

export const INS_KEYS = Object.freeze([
  "Property Insurance",
  "Casualty Insurance",
  "Flood Insurance",
  "Other Insurance",
]);

export const CAM_KEYS = Object.freeze([
  "Common-Area Utilities",
  "CAM",
  "Common-Area Routine Labor",
  "Other CAM",
]);

export const ADMIN_KEYS = Object.freeze([
  "Management",
  "Administrative & Legal",
  "Other Administrative Expenses",
]);

// ---------------------------------------------------------------------------
// 🧩 Capital Expense Keys
// --------------------------------------------------------------------------- 
export const CAPEX_KEYS = Object.freeze([
  "Financing Expense",
  "Capital Expenses",
  "Capital Reserve",
  "Other",
]);


// ---------------------------------------------------------------------------
// ⚙️ Computed subtotal rows (non-editable)
// ---------------------------------------------------------------------------
export const COMPUTED_OPEX_KEYS = new Set([
  "Subtotal Property Taxes",
  "Subtotal Insurance",
  "Subtotal CAM",
  "Subtotal Administrative & Other",
  "Total Operating Expenses",
]);

export default {
  TAX_KEYS,
  INS_KEYS,
  CAM_KEYS,
  ADMIN_KEYS,
  COMPUTED_OPEX_KEYS,
};


// ---------------------------------------------------------------------------
// Income section anchors & order
// ---------------------------------------------------------------------------
export const INCOME_ORDER = [
  "Gross Scheduled Rent",
  "Vacancy/Collections Loss",
  "Less - Free Rent and/or Allowances",
  "Less - Other Adjustments",
  "Net Rental Income",
  "Recoverable Income",
  "Other Income",
];

export const FIXED_FIRST_INCOME_KEY = "Gross Scheduled Rent";
export const FIXED_DIVIDER_INCOME_KEY = "Net Rental Income";
export const LOCKED_INCOME_KEYS = new Set([
  FIXED_FIRST_INCOME_KEY,
  FIXED_DIVIDER_INCOME_KEY,
]);
