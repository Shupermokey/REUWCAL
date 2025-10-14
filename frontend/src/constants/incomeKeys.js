// src/constants/incomeKeys.js

/** Fundamental numeric leaf fields for income statement */
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

/** Operating Expense subcategories */
export const TAX_KEYS = [
  "County-Level Property Taxes",
  "Municipality-Level Property Taxes",
  "Other Taxes",
];
export const INS_KEYS = [
  "Property Insurance",
  "Casualty Insurance",
  "Flood Insurance",
  "Other Insurance",
];
export const CAM_KEYS = [
  "Common-Area Utilities",
  "CAM",
  "Common-Area Routine Labor",
  "Other CAM",
];
export const ADMIN_KEYS = [
  "Management",
  "Administrative & Legal",
  "Other Administrative Expenses",
];

/** Computed subtotal/total row names (read-only lines) */
export const COMPUTED_OPEX_KEYS = new Set([
  "Subtotal Property Taxes",
  "Subtotal Insurance",
  "Subtotal CAM",
  "Subtotal Administrative & Other",
  "Total Operating Expenses",
]);
