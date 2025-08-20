// LEAF_KEYS, newLeaf, defaultStructure

export const LEAF_KEYS = [
  "grossAnnual","psfAnnual","pUnitAnnual",
  "grossMonthly","psfMonthly","pUnitMonthly",
];

export const newLeaf = () => ({
  grossAnnual: 0, psfAnnual: 0, pUnitAnnual: 0,
  grossMonthly: 0, psfMonthly: 0, pUnitMonthly: 0,
});

export const defaultStructure = {
  Income: { BRI: newLeaf(), RECI: newLeaf(), "Other Income": newLeaf() },
  Vacancy: { "Vacancy Loss": newLeaf() },
  OperatingExpenses: {
    "Property Tax": { "Base Tax": newLeaf() },
    Insurance: newLeaf(),
    "CAM Utilities": newLeaf(),
    "CAM Repairs": { Labor: newLeaf(), Material: newLeaf(), Other: newLeaf() },
    Management: newLeaf(),
    Other: newLeaf(),
  },
  CapitalExpenses: {
    "Financing Expense": newLeaf(),
    "Capital Expenses": newLeaf(),
    "Capital Reserve": newLeaf(),
    Other: newLeaf(),
  },
};
