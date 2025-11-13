// src/utils/baseline/createDefaultBaseline.js

const defaultRows = [
  { id: 0, name: "Base Rent (MR) Growth Rate", percentBRI: 100, $PSF: 100, growthRate: 0 },
  { id: 1, name: "Vacancy Rate", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 2, name: "Property Tax Expenses", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 3, name: "Property Insurance Expenses", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 4, name: "Property Utility Expenses", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 5, name: "Property CAM Expenses", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 6, name: "Property Repair Expenses", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 7, name: "Property Management Expenses", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 8, name: "Subtotal OPEx", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 9, name: "CAP Ex", percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 10, name: "Total Ex", percentBRI: 0, $PSF: 0, growthRate: 0 },
];

export const DEFAULT_BASELINE_ID = "default-baseline";

export const getDefaultBaseline = () => ({
  name: "Default Baseline",
  rows: defaultRows,
});
