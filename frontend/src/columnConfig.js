const columnConfig = {
  propertyAddress: {
    label: "Property Address",
    type: "string",
    input: "custom",
    width: 200,
  },
  propertyTaxes: {
    label: "Property Taxes",
    type: "number",
    input: "custom",
    width: 150,
  },
  propertyGSA: {
    label: "Gross Site Area",
    type: "number",
    input: "custom",
    width: 150,
  },
  propertyGBA: {
    label: "Gross Building Area",
    type: "number",
    input: "custom",
    width: 150,
  },
  purchasePrice: {
    label: "Purchase Price",
    type: "number",
    input: "custom",
    width: 150,
  },
  Category: {
    label: "Category",
    type: "string",
    input: "dropdown",
    optionsFrom: "baselines",
    width: 150,
  },
  EditingTools: {
    label: "Editing Tools",
    type: "controls",
    input: null,
    width: 200,
  },
};


// 👇 add this so `columnOrder` becomes available as a named export
export const columnOrder = [
  "propertyAddress",
  "propertyTaxes",
  "propertyGSA",
  "propertyGBA",
  "purchasePrice",
  "Category",
  "EditingTools",
];

export const columnWidths = {
  propertyAddress: 200,
  propertyTaxes: 150,
  propertyGSA: 150,
  propertyGBA: 150,
  purchasePrice: 150,
  Category: 150,
  EditingTools: 200, // wider to fit all buttons
};

export const breakdownConfig = {
  propertyAddress: [
    { label: "Property Address", type: "text", required: true },
    { label: "Property Title", type: "text" },

    // Zoning section
    {
      label: "Zoning Category",
      type: "radio", // changed from select to radio-style
      options: ["Commercial", "Residential"],
      style: "button", // to render as selectable boxes
      default: "Residential"
    },
    {
      label: "Zoning Subtype",
      type: "dynamic-select",
      dependsOn: "Zoning Category",
      map: {
        Commercial: ["Office", "Industrial", "Retail", "Special Use", "OTHER"],
        Residential: ["Single Family", "Multi Family", "Mixed Use", "OTHER"]
      },
      persistOther: true
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
  ]
};

export default columnConfig;
