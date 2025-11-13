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
/* 🧱 Default Income Statement structure (dynamic, constant-driven)            */
/* -------------------------------------------------------------------------- */
export const defaultStructure = {
  /* --------------------------- INCOME SECTION --------------------------- */
  Income: {
    ...buildSection(INCOME_ORDER),
  },

  /* ---------------------- OPERATING EXPENSES SECTION -------------------- */
  OperatingExpenses: {
    ...buildSection(TAX_KEYS),
    ...buildSection(INS_KEYS),
    ...buildSection(CAM_KEYS),
    ...buildSection(ADMIN_KEYS),
  },

  /* -------------------------- CAPITAL EXPENSES -------------------------- */
  CapitalExpenses: buildSection(CAPEX_KEYS),
};
