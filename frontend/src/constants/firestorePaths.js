// src/constants/firestorePaths.js
export const FIRESTORE_PATHS = Object.freeze({
  USERS: "users",
  PROPERTIES: "properties",
  BASELINES: "baselines",
  INCOME_STATEMENT: "incomeStatement",
  PROPERTY_TAXES: "propertyTaxes",
  GROSS_SITE_AREA: "grossSiteArea",
  GROSS_BUILDING_AREA: "grossBuildingArea",
  PURCHASE_PRICE: "purchasePrice",
  FINANCING: "financing",
  ZONING_CATEGORIES: "zoningCategories",
  ZONING_SUBTYPES: "zoningSubtypes",
  FILE_SYSTEM: "fileSystem",
  SCENARIOS: "scenarios",
});

// ✅ Helper path builders
export const userPath = (uid) => `${FIRESTORE_PATHS.USERS}/${uid}`;

export const propertyPath = (uid, pid) =>
  `${userPath(uid)}/${FIRESTORE_PATHS.PROPERTIES}/${pid}`;

export const sectionPath = (uid, pid, section) =>
  `${propertyPath(uid, pid)}/${section}/current`;
