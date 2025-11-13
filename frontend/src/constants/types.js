// src/constants/types.js

/** --------------------------------------------------
 * ENUM-LIKE CONSTANTS (use with Object.freeze)
 * -------------------------------------------------- */

/** Property-level data groups in Firestore */
export const PROPERTY_SECTIONS = Object.freeze({
  BASELINES: "baselines",
  PROPERTY_TAXES: "propertyTaxes",
  GROSS_SITE_AREA: "grossSiteArea",
  GROSS_BUILDING_AREA: "grossBuildingArea",
  PURCHASE_PRICE: "purchasePrice",
  FINANCING: "financing",
  INCOME_STATEMENT: "incomeStatement",
});

/** User roles (for future collaboration) */
export const USER_ROLES = Object.freeze({
  OWNER: "Owner",
  COLLABORATOR: "Collaborator",
  VIEWER: "Viewer",
});

/** Supported currencies */
export const CURRENCIES = Object.freeze({
  USD: "USD",
  EUR: "EUR",
  PLN: "PLN",
});

/** File types for upload filtering */
export const FILE_TYPES = Object.freeze({
  IMAGE: "image",
  PDF: "pdf",
  EXCEL: "excel",
  WORD: "word",
  OTHER: "other",
});

/** UI view modes */
export const VIEW_MODE = Object.freeze({
  MONTHLY: "monthly",
  ANNUAL: "annual",
  BOTH: "both",
});

/** --------------------------------------------------
 * SHAPE-LIKE OBJECTS (pseudo-type blueprints)
 * -------------------------------------------------- */

/** Baseline Assumption shape */
export const BASELINE_SHAPE = Object.freeze({
  name: "",
  createdAt: null,
  rows: [],
});

/** Property shape */
export const PROPERTY_SHAPE = Object.freeze({
  id: "",
  name: "",
  address: "",
  zoningCategory: "",
  zoningSubtype: "",
  createdAt: null,
  updatedAt: null,
});

/** Subscription shape */
export const SUBSCRIPTION_SHAPE = Object.freeze({
  id: "",
  tier: "",
  priceId: "",
  active: false,
  expiresAt: null,
});
