// ---------------------------------------------------------------------------
// Core Column Keys (canonical identifiers used throughout app)
// ---------------------------------------------------------------------------
export const COLUMN_KEYS = Object.freeze({
  PROPERTY_ADDRESS: "propertyAddress",
  PROPERTY_TAXES: "propertyTaxes",
  GROSS_SITE_AREA: "propertyGSA",
  GROSS_BUILDING_AREA: "propertyGBA",
  UNITS: "units",
  PURCHASE_PRICE: "purchasePrice",
  INCOME_STATEMENT: "incomeStatement",
  FINANCING: "financing",
  CATEGORY: "category",
  EDITING_TOOLS: "EditingTools",
});

// ---------------------------------------------------------------------------
// Column Order (drives table display sequence)
// ---------------------------------------------------------------------------
export const COLUMN_ORDER = [
  COLUMN_KEYS.PROPERTY_ADDRESS,
  COLUMN_KEYS.PROPERTY_TAXES,
  COLUMN_KEYS.GROSS_SITE_AREA,
  COLUMN_KEYS.GROSS_BUILDING_AREA,
  COLUMN_KEYS.UNITS,
  COLUMN_KEYS.PURCHASE_PRICE,
  COLUMN_KEYS.INCOME_STATEMENT,
  COLUMN_KEYS.FINANCING,
  COLUMN_KEYS.CATEGORY,
  COLUMN_KEYS.EDITING_TOOLS,
];

// ---------------------------------------------------------------------------
// Column Config (metadata for rendering & behavior)
// ---------------------------------------------------------------------------
export const COLUMN_CONFIG = {
  [COLUMN_KEYS.PROPERTY_ADDRESS]: {
    label: "Property Address",
    type: "string",
    input: "custom",
    width: 200,
  },
  [COLUMN_KEYS.PROPERTY_TAXES]: {
    label: "Property Taxes",
    type: "number",
    input: "custom",
    width: 150,
  },
  [COLUMN_KEYS.GROSS_SITE_AREA]: {
    label: "Gross Site Area",
    type: "number",
    input: "custom",
    width: 150,
  },
  [COLUMN_KEYS.GROSS_BUILDING_AREA]: {
    label: "Gross Building Area",
    type: "number",
    input: "custom",
    width: 150,
  },
  [COLUMN_KEYS.UNITS]: {
    label: "Units",
    type: "number",
    input: "custom",
    width: 120,
  },
  [COLUMN_KEYS.PURCHASE_PRICE]: {
    label: "Purchase Price",
    type: "number",
    input: "custom",
    width: 160,
  },
  [COLUMN_KEYS.INCOME_STATEMENT]: {
    label: "Income Statement",
    type: "number",
    input: "custom",
    width: 160,
  },
  [COLUMN_KEYS.FINANCING]: {
    label: "Financing",
    type: "number",
    input: "custom",
    width: 150,
  },
  [COLUMN_KEYS.CATEGORY]: {
    label: "Category",
    type: "string",
    input: "dropdown",
    optionsFrom: "baselines",
    width: 150,
  },
  [COLUMN_KEYS.EDITING_TOOLS]: {
    label: "Editing Tools",
    type: "controls",
    input: null,
    width: 200,
  },
};

// ---------------------------------------------------------------------------
// Utility Exports
// ---------------------------------------------------------------------------
export const COLUMN_LABELS = Object.fromEntries(
  Object.entries(COLUMN_CONFIG).map(([k, v]) => [k, v.label])
);

export default COLUMN_CONFIG;
