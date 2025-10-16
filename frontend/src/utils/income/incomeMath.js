import { LEAF_KEYS } from "@/constants/incomeKeys.js";

export const ZERO = Object.fromEntries(LEAF_KEYS.map((k) => [k, 0]));
export const cloneZero = () => ({ ...ZERO });

export const isLeaf = (v) =>
  v && typeof v === "object" && LEAF_KEYS.every((k) => typeof v[k] === "number");

export function sumNode(node) {
  if (!node) return cloneZero();
  if (isLeaf(node)) return { ...node };

  const total = cloneZero();
  Object.values(node).forEach((child) => {
    const s = sumNode(child);
    for (const k of LEAF_KEYS) total[k] += s[k] || 0;
  });
  return total;
}

export function syncByView(leaf, view, key, n) {
  const next = { ...leaf };
  const A = { gross: "grossAnnual", psf: "psfAnnual", punit: "punitAnnual" };
  const M = { gross: "grossMonthly", psf: "psfMonthly", punit: "punitMonthly" };
  if (view === "annual") { next[A[key]] = n; next[M[key]] = n / 12; }
  else { next[M[key]] = n; next[A[key]] = n * 12; }
  return next;
}

export const calcPSF = (gross, gba) => {
  if (!gba || gba <= 0) return 0;
  return parseFloat((gross / gba).toFixed(4));
};

export const calcPUnit = (gross, units) => {
  if (!units || units <= 0) return 0;
  return parseFloat((gross / units).toFixed(4));
};
