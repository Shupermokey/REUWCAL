/**
 * Configuration for special income statement items
 */

// Special item IDs
export const SPECIAL_IDS = {
  GROSS_SCHEDULED_RENT: "gsr",
  NET_RENTAL_INCOME: "nri",
  TOTAL_INCOME: "total-income",
  TOTAL_OPERATING_EXPENSES: "total-opex",
  TOTAL_CAPITAL_EXPENSES: "total-capex",
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
 * Initialize a section with required special items
 */
export function initializeSection(sectionKey) {
  const order = [];
  const items = {};

  switch (sectionKey) {
    case "Income": {
      // Gross Scheduled Rent at top
      order.push(SPECIAL_IDS.GROSS_SCHEDULED_RENT);
      items[SPECIAL_IDS.GROSS_SCHEDULED_RENT] = {
        id: SPECIAL_IDS.GROSS_SCHEDULED_RENT,
        label: ITEM_CONFIG[SPECIAL_IDS.GROSS_SCHEDULED_RENT].label,
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

      // Net Rental Income in middle
      order.push(SPECIAL_IDS.NET_RENTAL_INCOME);
      items[SPECIAL_IDS.NET_RENTAL_INCOME] = {
        id: SPECIAL_IDS.NET_RENTAL_INCOME,
        label: ITEM_CONFIG[SPECIAL_IDS.NET_RENTAL_INCOME].label,
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

      // Total at bottom (will be added when rendering)
      break;
    }

    case "OperatingExpenses":
    case "CapitalExpenses":
      // No special items yet, boss hasn't specified
      break;

    default:
      break;
  }

  return { order, items };
}
