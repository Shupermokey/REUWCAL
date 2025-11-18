// src/utils/income/incomeDefaults.js
import {
  LEAF_KEYS,
  INCOME_ORDER,
  TAX_KEYS,
  INS_KEYS,
  CAM_KEYS,
  ADMIN_KEYS,
  CAPEX_KEYS,
} from "@/constants/incomeKeys.js";

/* -------------------------------------------------------------------------- */
/* 🌱 newLeaf – creates a blank leaf with all standard fields                 */
/* -------------------------------------------------------------------------- */
export const newLeaf = () =>
  Object.fromEntries(LEAF_KEYS.map((key) => [key, 0]));

/* -------------------------------------------------------------------------- */
/* 🏗️ Helper to generate a section from an array of keys                      */
/* -------------------------------------------------------------------------- */
const buildSection = (keys) =>
  Object.fromEntries(keys.map((label) => [label, newLeaf()]));

/* -------------------------------------------------------------------------- */
/* 🧱 Helper to create an item with the new structure                         */
/* -------------------------------------------------------------------------- */
const createItem = (id, label) => ({
  id,
  label,
  ...newLeaf(),
});

/* -------------------------------------------------------------------------- */
/* 🧱 Default Income Statement structure (NEW nested structure)               */
/* -------------------------------------------------------------------------- */
export const defaultStructure = {
  /* --------------------------- INCOME SECTION --------------------------- */
  Income: {
    order: ["gsr", "vacancy-collections-loss", "nri", "total-income"],
    items: {
      "gsr": {
        ...createItem("gsr", "Gross Scheduled Rent"),
        children: {},
        childOrder: [],
      },
      "vacancy-collections-loss": {
        ...createItem("vacancy-collections-loss", "Vacancy/Collections Loss"),
        children: {},
        childOrder: [],
      },
      "nri": createItem("nri", "Net Rental Income"),
      "total-income": createItem("total-income", "Total Operating Income"),
    },
  },

  /* ---------------------- OPERATING EXPENSES SECTION -------------------- */
  OperatingExpenses: {
    order: [],
    items: {},
  },

  /* -------------------------- CAPITAL EXPENSES -------------------------- */
  CapitalExpenses: {
    order: [],
    items: {},
  },
};
