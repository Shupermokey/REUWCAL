// utils/incomeLayout.js
export const SECTION_LAYOUT = [
  { key: "Income", title: "Operating Income" },

  {
    key: "OperatingExpenses",
    title: "Operating Expenses",
    rows: [
      // Property Taxes
      { key: "County-Level Property Taxes", label: "County-Level Property Taxes", group: "PropertyTaxes", role: "line" },
      { key: "Municipality-Level Property Taxes", label: "Municipality-Level Property Taxes", group: "PropertyTaxes", role: "line" },
      { key: "Other Taxes", label: "Other Taxes", group: "PropertyTaxes", role: "line" },
      { key: "__SubtotalPropertyTaxes__", label: "Subtotal Property Taxes", group: "PropertyTaxes", role: "subtotal" },

      // Insurance
      { key: "Property Insurance", label: "Property Insurance", group: "Insurance", role: "line" },
      { key: "Casualty Insurance", label: "Casualty Insurance", group: "Insurance", role: "line" },
      { key: "Flood Insurance", label: "Flood Insurance", group: "Insurance", role: "line" },
      { key: "Other Insurance", label: "Other Insurance", group: "Insurance", role: "line" },
      { key: "__SubtotalInsurance__", label: "Subtotal Insurance", group: "Insurance", role: "subtotal" },

      // CAM
      { key: "Common-Area Utilities", label: "Common-Area Utilities", group: "CAM", role: "line" },
      { key: "Common-Area Repairs & Maintenance", label: "Common-Area Repairs & Maintenance", group: "CAM", role: "line" },
      { key: "Common-Area Routine Labor", label: "Common-Area Routine Labor", group: "CAM", role: "line" },
      { key: "Other CAM", label: "Other CAM", group: "CAM", role: "line" },
      { key: "__SubtotalCAM__", label: "Subtotal CAM", group: "CAM", role: "subtotal" },

      // Administrative & Other
      { key: "Management", label: "Management", group: "AdminOther", role: "line", isPercent: true },
      { key: "Administrative & Legal", label: "Administrative & Legal", group: "AdminOther", role: "line" },
      { key: "Other Administrative Expenses", label: "Other Administrative Expenses", group: "AdminOther", role: "line" },
      { key: "__SubtotalAdministrativeOther__", label: "Subtotal Administrative & Other", group: "AdminOther", role: "subtotal" },

      // Section total
      { key: "Total Operating Expenses", label: "Total Operating Expenses", role: "sectionTotal" },
    ],
  },

  { key: "CapitalExpenses", title: "Capital Expenses" },
];
