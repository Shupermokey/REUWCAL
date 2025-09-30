import { LEAF_KEYS } from "./incomeDefaults.js";

const ZERO = {
  grossAnnual: 0, psfAnnual: 0, pUnitAnnual: 0,
  grossMonthly: 0, psfMonthly: 0, pUnitMonthly: 0,
};
export const cloneZero = () => ({ ...ZERO });

export const isLeaf = (v) => {
  if (!v || typeof v !== "object") return false;
  const keys = Object.keys(v);
  if (keys.length !== LEAF_KEYS.length) return false;
  return LEAF_KEYS.every((k) => typeof v[k] === "number");
};

export function sumNode(node) {
  if (!node) return cloneZero();
  if (isLeaf(node)) return { ...node };
  const t = cloneZero();
  for (const child of Object.values(node)) {
    const s = sumNode(child);
    t.grossAnnual += s.grossAnnual || 0;
    t.psfAnnual   += s.psfAnnual || 0;
    t.pUnitAnnual += s.pUnitAnnual || 0;
    t.grossMonthly += s.grossMonthly || 0;
    t.psfMonthly   += s.psfMonthly || 0;
    t.pUnitMonthly += s.pUnitMonthly || 0;
  }
  return t;
}

// keep annual/monthly in sync when editing one side
export function syncByView(leaf, view, key, n) {
  const next = { ...leaf };
  const A = { gross: "grossAnnual", psf: "psfAnnual", punit: "pUnitAnnual" };
  const M = { gross: "grossMonthly", psf: "psfMonthly", punit: "pUnitMonthly" };
  if (view === "annual") { next[A[key]] = n; next[M[key]] = n / 12; }
  else { next[M[key]] = n; next[A[key]] = n * 12; }
  return next;
}
