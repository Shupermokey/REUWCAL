// src/domain/incomeStatement.js
import {
  LEAF_KEYS,
  TAX_KEYS,
  INS_KEYS,
  CAM_KEYS,
  ADMIN_KEYS,
  COMPUTED_OPEX_KEYS,
} from "@/constants/incomeKeys.js";
import { newLeaf } from "@/utils/income/incomeDefaults.js";
import { isLeaf, sumNode, cloneZero } from "@/utils/income/incomeMath.js";

/* -------------------------------------------------------------------------- */
/* 🧮  Aggregation & Summation Utilities                                      */
/* -------------------------------------------------------------------------- */

/**
 * Sum a set of keys (rows) inside a section.
 * Used for subtotals like "Subtotal Property Taxes".
 */
export const sumKeys = (section = {}, keys = []) => {
  const total = cloneZero();
  for (const key of keys) {
    const node = section[key];
    if (!node) continue;
    const partial = sumNode(node);
    for (const k of LEAF_KEYS) total[k] += partial[k] || 0;
  }
  return total;
};

/**
 * Sum all major income statement sections.
 * Returns high-level aggregates like EGI, NOI, etc.
 */
export const computeStatementTotals = (data = {}) => {
  const inc = sumNode(data.Income);
  const opx = sumNode(data.OperatingExpenses);
  const capx = sumNode(data.CapitalExpenses);

  const egi = inc.grossAnnual;
  const noi = egi - opx.grossAnnual;
  const unlevered = noi - capx.grossAnnual;
  const financing =
    data?.CapitalExpenses?.["Financing Expense"]?.grossAnnual || 0;
  const levered = unlevered - financing;

  return { egi, noi, unlevered, levered };
};

/* -------------------------------------------------------------------------- */
/* 🧾  Operating Expenses Derived View                                        */
/* -------------------------------------------------------------------------- */

/**
 * Build the Operating Expenses section with computed subtotal/total rows.
 * This version mirrors your UI layout and ensures read-only subtotals.
 */
export const buildOperatingExpensesView = (opex = {}) => {
  const out = {};

  // Taxes
  TAX_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal Property Taxes"] = sumKeys(opex, TAX_KEYS);

  // Insurance
  INS_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal Insurance"] = sumKeys(opex, INS_KEYS);

  // CAM
  CAM_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal CAM"] = sumKeys(opex, CAM_KEYS);

  // Admin
  ADMIN_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal Administrative & Other"] = sumKeys(opex, ADMIN_KEYS);

  // Section total
  out["Total Operating Expenses"] = sumKeys(opex, [
    ...TAX_KEYS,
    ...INS_KEYS,
    ...CAM_KEYS,
    ...ADMIN_KEYS,
  ]);

  return out;
};

/**
 * Determine which rows should be locked (read-only and not draggable).
 */
export const getLockedOpexKeys = () => new Set(COMPUTED_OPEX_KEYS);

/* -------------------------------------------------------------------------- */
/* 🧮  Metrics Extraction                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Pull GBA (sqft) and Units from table rowData.
 * This normalizes different naming variants into standard metrics.
 */
export const extractMetricsFromRow = (rowData = {}) => {
  const num = (v) => (Number.isFinite(+v) ? +v : 0);

  const gbaSqft =
    num(rowData.gbaSqFt) ||
    num(rowData.grossBuildingAreaSqFt) ||
    num(rowData.squareFeet) ||
    num(rowData.grossBuildingArea);

  const units =
    num(rowData.units) ||
    num(rowData.numUnits) ||
    num(rowData.resUnits) ||
    num(rowData.unitCount);

  return { gbaSqft, units };
};

export const sumSectionColumns = (sectionObj) => {
  const totals = Object.fromEntries(LEAF_KEYS.map((k) => [k, 0]));
  const walk = (obj) =>
    Object.values(obj || {}).forEach((v) => {
      if (isLeaf(v)) LEAF_KEYS.forEach((k) => (totals[k] += Number(v[k] || 0)));
      else if (typeof v === "object") walk(v);
    });
  walk(sectionObj || {});
  return totals;
};

/* -------------------------------------------------------------------------- */
/* 📦  Exports                                                               */
/* -------------------------------------------------------------------------- */
export default {
  sumKeys,
  computeStatementTotals,
  buildOperatingExpensesView,
  getLockedOpexKeys,
  extractMetricsFromRow,
};
