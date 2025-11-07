/**
 * Configuration for special income statement items
 */

import {
  INCOME_ORDER,
  TAX_KEYS,
  INS_KEYS,
  CAM_KEYS,
  ADMIN_KEYS,
  CAPEX_KEYS,
} from "@/constants/incomeKeys.js";

// Special item IDs
export const SPECIAL_IDS = {
  GROSS_SCHEDULED_RENT: "gsr",
  NET_RENTAL_INCOME: "nri",
  TOTAL_INCOME: "total-income",
  TOTAL_OPERATING_EXPENSES: "total-opex",
  TOTAL_CAPITAL_EXPENSES: "total-capex",
  // Operating Expense Group IDs
  TAX_GROUP: "tax-group",
  INS_GROUP: "ins-group",
  CAM_GROUP: "cam-group",
  ADMIN_GROUP: "admin-group",
};

/**
 * Item configuration
 * - pinned: Cannot be moved/reordered
 * - calculated: Value is auto-calculated, not user-editable
 * - required: Cannot be deleted
 * - allowSub: Can add sub-items
 * - allowClone: Can be cloned
 * - allowDelete: Can be deleted
 * - forceNegative: Force values to be negative
 */
export const ITEM_CONFIG = {
  [SPECIAL_IDS.GROSS_SCHEDULED_RENT]: {
    label: "Gross Scheduled Rent",
    pinned: true,
    calculated: false,
    required: true,
    allowSub: true,
    allowClone: false,
    allowDelete: false,
    forceNegative: false,
  },
  [SPECIAL_IDS.NET_RENTAL_INCOME]: {
    label: "Net Rental Income",
    pinned: true,
    calculated: true,
    required: true,
    allowSub: false,
    allowClone: false,
    allowDelete: false,
    forceNegative: false,
  },
  [SPECIAL_IDS.TOTAL_INCOME]: {
    label: "Total Operating Income",
    pinned: true,
    calculated: true,
    required: true,
    allowSub: false,
    allowClone: false,
    allowDelete: false,
    forceNegative: false,
  },
  [SPECIAL_IDS.TOTAL_OPERATING_EXPENSES]: {
    label: "Total Operating Expenses",
    pinned: true,
    calculated: true,
    required: true,
    allowSub: false,
    allowClone: false,
    allowDelete: false,
    forceNegative: false,
  },
  [SPECIAL_IDS.TOTAL_CAPITAL_EXPENSES]: {
    label: "Total Capital Expenses",
    pinned: true,
    calculated: true,
    required: true,
    allowSub: false,
    allowClone: false,
    allowDelete: false,
    forceNegative: false,
  },
};

/**
 * Default item config for regular items
 */
export const DEFAULT_ITEM_CONFIG = {
  pinned: false,
  calculated: false,
  required: false,
  allowSub: true,
  allowClone: true,
  allowDelete: true,
  forceNegative: false,
};

/**
 * Get config for an item
 */
export function getItemConfig(itemId) {
  return ITEM_CONFIG[itemId] || DEFAULT_ITEM_CONFIG;
}

/**
 * Check if item is between GSR and NRI (should be forced negative)
 */
export function isDeductionItem(sectionKey, itemId, order) {
  if (sectionKey !== "Income") return false;

  const gsrIndex = order.indexOf(SPECIAL_IDS.GROSS_SCHEDULED_RENT);
  const nriIndex = order.indexOf(SPECIAL_IDS.NET_RENTAL_INCOME);
  const itemIndex = order.indexOf(itemId);

  // If between GSR and NRI, it's a deduction
  return itemIndex > gsrIndex && itemIndex < nriIndex;
}

/**
 * Helper to create a basic item
 */
function createBasicItem(id, label) {
  return {
    id,
    label,
    grossMonthly: 0,
    grossAnnual: 0,
    rateMonthly: 0,
    rateAnnual: 0,
    psfMonthly: 0,
    psfAnnual: 0,
    punitMonthly: 0,
    punitAnnual: 0,
    childOrder: [],
    children: {},
  };
}

/**
 * Helper to generate a simple ID from a label
 */
function generateIdFromLabel(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Initialize a section with required special items
 */
export function initializeSection(sectionKey) {
  const order = [];
  const items = {};

  switch (sectionKey) {
    case "Income": {
      // Add items from INCOME_ORDER
      INCOME_ORDER.forEach((label) => {
        const id = label === "Gross Scheduled Rent"
          ? SPECIAL_IDS.GROSS_SCHEDULED_RENT
          : label === "Net Rental Income"
          ? SPECIAL_IDS.NET_RENTAL_INCOME
          : generateIdFromLabel(label);

        order.push(id);
        items[id] = createBasicItem(id, label);
      });

      break;
    }

    case "OperatingExpenses": {
      // Create groups: Taxes, Insurance, CAM, Admin
      const groups = [
        { id: SPECIAL_IDS.TAX_GROUP, label: "Property Taxes", children: TAX_KEYS },
        { id: SPECIAL_IDS.INS_GROUP, label: "Insurance", children: INS_KEYS },
        { id: SPECIAL_IDS.CAM_GROUP, label: "CAM", children: CAM_KEYS },
        { id: SPECIAL_IDS.ADMIN_GROUP, label: "Administrative & Other", children: ADMIN_KEYS },
      ];

      groups.forEach(({ id, label, children: childLabels }) => {
        order.push(id);

        const childOrder = [];
        const children = {};

        childLabels.forEach((childLabel) => {
          const childId = generateIdFromLabel(childLabel);
          childOrder.push(childId);
          children[childId] = createBasicItem(childId, childLabel);
        });

        items[id] = {
          ...createBasicItem(id, label),
          childOrder,
          children,
        };
      });

      break;
    }

    case "CapitalExpenses": {
      // Add items from CAPEX_KEYS
      CAPEX_KEYS.forEach((label) => {
        const id = generateIdFromLabel(label);
        order.push(id);
        items[id] = createBasicItem(id, label);
      });

      break;
    }

    default:
      break;
  }

  return { order, items };
}
