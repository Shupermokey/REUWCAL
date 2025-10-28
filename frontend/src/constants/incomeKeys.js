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

// ---------------------------------------------------------------------------
// Opex groupings
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Read-only subtotal / total rows
// ---------------------------------------------------------------------------
export const COMPUTED_OPEX_KEYS = new Set([
  "Subtotal Property Taxes",
  "Subtotal Insurance",
  "Subtotal CAM",
  "Subtotal Administrative & Other",
  "Total Operating Expenses",
]);

// ---------------------------------------------------------------------------
// Income section anchors & order
// ---------------------------------------------------------------------------
export const INCOME_ORDER = [
  "Gross Scheduled Rent",
  "Less - Free Rent and/or Allowances",
  "Less - Other Adjustments",
  "Net Rental Income",
  "Recoverable Income",
  "BRI",
  "Other Income",
];

export const FIXED_FIRST_INCOME_KEY = "Gross Scheduled Rent";
export const FIXED_DIVIDER_INCOME_KEY = "Net Rental Income";
export const LOCKED_INCOME_KEYS = new Set([
  FIXED_FIRST_INCOME_KEY,
  FIXED_DIVIDER_INCOME_KEY,
]);
