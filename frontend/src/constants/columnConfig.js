import {HEADER_KEYS} from "@/constants/tableHeaders.js";

const columnConfig = {
  [HEADER_KEYS.PROPERTY_ADDRESS]: {
    label: "Property Address",
    type: "string",
    input: "custom",
    width: 200,
  },
  [HEADER_KEYS.PROPERTY_TAXES]: {
    label: "Property Taxes",
    type: "number",
    input: "custom",
    width: 150,
  },
  [HEADER_KEYS.GROSS_SITE_AREA]: {
    label: "Gross Site Area",
    type: "number",
    input: "custom",
    width: 150,
  },
  [HEADER_KEYS.GROSS_BUILDING_AREA]: {
    label: "Gross Building Area",
    type: "number",
    input: "custom",
    width: 150,
  },
  [HEADER_KEYS.UNITS]: {
    label: "Units",
    type: "number",
    input: "custom",
    width: 50,
  },
  [HEADER_KEYS.PURCHASE_PRICE]: {
    label: "Purchase Price",
    type: "number",
    input: "custom",
    width: 150,
  },
  [HEADER_KEYS.INCOME_STATEMENT]: {
    label: "Income Statement",
    type: "number",
    input: "custom",
    width: 150,
    //readOnly: true,
  },
  [HEADER_KEYS.FINANCING]: {
    label: "Financing",
    type: "number",
    input: "custom",
    width: 150,
  },
  [HEADER_KEYS.CATEGORY]: {
    label: "Category",
    type: "string",
    input: "dropdown",
    optionsFrom: "baselines",
    width: 150,
  },
  [HEADER_KEYS.EDITING_TOOLS]: {
    label: "Editing Tools",
    type: "controls",
    input: null,
    width: 100,
  },
};

// 👇 add this so `columnOrder` becomes available as a named export
export const columnOrder = [
  HEADER_KEYS.PROPERTY_ADDRESS,
  HEADER_KEYS.PROPERTY_TAXES,
  HEADER_KEYS.GROSS_SITE_AREA,
  HEADER_KEYS.GROSS_BUILDING_AREA,
  HEADER_KEYS.UNITS,
  HEADER_KEYS.PURCHASE_PRICE,
  HEADER_KEYS.INCOME_STATEMENT,
  HEADER_KEYS.FINANCING,
  HEADER_KEYS.CATEGORY,
  HEADER_KEYS.EDITING_TOOLS,
];

export const breakdownConfig = {
  propertyAddress: [
    { label: "Property Address", type: "text", required: true },
    { label: "Property Title", type: "text" },

    // Zoning section
    {
      label: "Zoning Category",
      type: "radio",
      options: ["Commercial", "Residential"],
      style: "button",
      default: "Residential",
    },
    {
      label: "Zoning Subtype",
      type: "dynamic-select",
      dependsOn: "Zoning Category",
      map: {
        Commercial: ["Office", "Industrial", "Retail", "Special Use", "OTHER"],
        Residential: ["Single Family", "Multi Family", "Mixed Use", "OTHER"],
      },
      persistOther: true,
    },
    { label: "Zoning Code", type: "text" },
    { label: "Zoning Map", type: "folder" },
    { label: "Zoning Ordinance", type: "folder" },

    // Flood Zone
    { label: "FEMA ID", type: "text" },
    { label: "Flood Zone", type: "folder" },

    // Other folders
    { label: "Marketing", type: "folder" },
    { label: "MSA", type: "folder" },
    { label: "Demographics", type: "folder" },
    { label: "Traffic Patterns", type: "folder" },
    { label: "Property Reports", type: "folder" },
    { label: "Corporate Governance", type: "folder" },
  ],
  propertyTaxes: [
    { label: "Tax PIN", type: "text" },
    { label: "Tax Amount", type: "number", required: true },
    { label: "Size (sq ft)", type: "number" },
    { label: "Assessment", type: "folder" },
    { label: "Property Report", type: "folder" },
    { label: "Tax Bill", type: "folder" },
    { label: "Potential Tax Bills", type: "folder" },
  ],
  propertyGSA: [
    {
      label: "Acres",
      type: "number",
    },
    {
      label: "Square Feet",
      type: "number",
    },
    { label: "Property Survey", type: "folder" },
  ],
  propertyGBA: [
    {
      label: "Gross Building Area (GBA)",
      type: "number",
      required: true,
    },
    {
      label: "Gross Living Area (GLA)",
      type: "number",
    },
    {
      label: "Net Rentable Area (NRA)",
      type: "number",
    },
    { label: "Floor Plans", type: "folder" },
    { label: "Other", type: "folder" },
  ],
  purchasePrice: [
    { label: "Contract Price", type: "number" },
    { label: "Transaction", type: "number" },
    { label: "Due Diligence", type: "number" },
    { label: "Other", type: "number" }, // supports subinputs
    {
      label: "Capital To Stabilize",
      type: "number",
    },
    {
      label: "Timeframe",
      type: "text",
    },
    { label: "Capital Reserve", type: "number" },
    { label: "Other (Purchase Price)", type: "number" },
  ],
  incomeStatement: [
    { label: "Temp", type: "number" },
  ],
  marketRate: [
    { label: "Contract Price", type: "number" },
    { label: "Transaction", type: "number" },
    { label: "Due Diligence", type: "number" },
    { label: "Other", type: "number" }, // supports subinputs
    {
      label: "Capital To Stabilize",
      type: "number",
    },
    {
      label: "Timeframe",
      type: "text",
    },
    { label: "Capital Reserve", type: "number" },
    { label: "Other (Purchase Price)", type: "number" },
  ],
};



export default columnConfig;
