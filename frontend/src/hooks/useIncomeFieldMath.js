import { useCallback, useEffect, useRef } from "react";
import { recalcMetrics } from "@/utils/income";
import {
  FIXED_FIRST_INCOME_KEY,
  FIXED_DIVIDER_INCOME_KEY,
} from "@/constants/incomeKeys.js";

const isNum = (v) => v !== "" && v != null && Number.isFinite(+v);
const toMonthly = (n) => (isNum(n) ? +n / 12 : 0);
const toAnnual = (n) => (isNum(n) ? +n * 12 : 0);
const makeRoundN =
  (p = 2) =>
  (n) =>
    isNum(n)
      ? Math.round(n * Math.pow(10, p)) / Math.pow(10, p)
      : n;

/* -------------------------------------------------------------------------- */
/* 🧮 useIncomeFieldMath – safe numeric, sign, and derived logic              */
/* -------------------------------------------------------------------------- */
export function useIncomeFieldMath({
  setAtPath,
  fullPath,
  metrics,
  deriveFromMetrics,
  precision = 2,
  fullData,
}) {
  const GBA = Number(metrics?.gbaSqft) || 0;
  const UNITS = Number(metrics?.units) || 0;
  const roundN = makeRoundN(precision);
  const prevMetricsRef = useRef({ GBA, UNITS });
  const suppressRef = useRef(false); // prevent recursive writes

  /* -------------------- Auto-recalc on metric change -------------------- */
  useEffect(() => {
    if (!deriveFromMetrics) return;
    const prev = prevMetricsRef.current;
    if (prev.GBA !== GBA || prev.UNITS !== UNITS) {
      prevMetricsRef.current = { GBA, UNITS };
      setAtPath(fullPath, (p = {}) => recalcMetrics(p, { GBA, UNITS }));
    }
  }, [GBA, UNITS, deriveFromMetrics, fullPath, setAtPath]);

  /* -------------------- Core handler -------------------- */
  const handleChange = useCallback(
    (field, raw) => {
      if (suppressRef.current) return;
      console.log("Handling change for", fullPath, field, raw);

      const n = raw === "" ? "" : Number(raw);

      // --- 1️⃣ Main update: modify only the field being edited
      setAtPath(fullPath, (prev = {}) => {
        const next = structuredClone(prev);
        next[field] = n;

        // --- 2️⃣ Monthly↔Annual mirroring (lightweight)
        if (field.endsWith("Monthly")) {
          if (field === "rateMonthly" && isNum(n))
            next.rateAnnual = roundN(toAnnual(n));
          if (field === "grossMonthly" && isNum(n))
            next.grossAnnual = roundN(toAnnual(n));
        } else if (field.endsWith("Annual")) {
          if (field === "grossAnnual" && isNum(n))
            next.grossMonthly = roundN(toMonthly(n));
        }

        // --- 3️⃣ Sign enforcement (applies only to the edited field)
        const pathParts = fullPath.split(".");
        if (pathParts[0] === "Income" && fullData?.Income) {
          const incomeKeys = Object.keys(fullData.Income);
          const currentKey = pathParts[1];
          const gsrIndex = incomeKeys.indexOf(FIXED_FIRST_INCOME_KEY);
          const nriIndex = incomeKeys.indexOf(FIXED_DIVIDER_INCOME_KEY);
          const curIndex = incomeKeys.indexOf(currentKey);
          const isBetween = curIndex > gsrIndex && curIndex < nriIndex;
          const isBelow = curIndex > nriIndex;

          if (isBetween && next[field] > 0) next[field] = -next[field];
          if (isBelow && next[field] < 0) next[field] = Math.abs(next[field]);
        }

        return next;
      });

      // --- 4️⃣ Auto-update Net Rental Income totals
      if (fullPath.startsWith("Income.") && fullData?.Income) {
        const incomeKeys = Object.keys(fullData.Income);
        const gsrIndex = incomeKeys.indexOf(FIXED_FIRST_INCOME_KEY);
        const nriIndex = incomeKeys.indexOf(FIXED_DIVIDER_INCOME_KEY);

        if (gsrIndex >= 0 && nriIndex >= 0) {
          const rowsAboveNRI = incomeKeys.slice(gsrIndex, nriIndex);
          const totals = {
            grossAnnual: 0,
            grossMonthly: 0,
            psfAnnual: 0,
            psfMonthly: 0,
            punitAnnual: 0,
            punitMonthly: 0,
            rateAnnual: 0,
            rateMonthly: 0,
          };

          for (const key of rowsAboveNRI) {
            const node = fullData.Income[key];
            if (!node) continue;
            for (const f in totals)
              if (typeof node[f] === "number") totals[f] += node[f];
          }

          suppressRef.current = true;
          setAtPath("Income.Net Rental Income", () => structuredClone(totals));
          suppressRef.current = false;
        }
      }
    },
    [fullPath, setAtPath, fullData, GBA, UNITS, roundN]
  );


 return { handleChange };


}
