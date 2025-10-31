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

      const n = raw === "" ? "" : Number(raw);

      // ✅ Main value change
      setAtPath(fullPath, (prev = {}) => {
        const next = structuredClone(prev);
        next[field] = n;

        // --- Sign enforcement for Income section
        const pathParts = fullPath.split(".");
        if (pathParts[0] === "Income" && fullData?.Income) {
          const incomeKeys = Object.keys(fullData.Income);
          const currentKey = pathParts[1];
          const gsrIndex = incomeKeys.indexOf(FIXED_FIRST_INCOME_KEY);
          const nriIndex = incomeKeys.indexOf(FIXED_DIVIDER_INCOME_KEY);
          const curIndex = incomeKeys.indexOf(currentKey);
          const isBetween = curIndex > gsrIndex && curIndex < nriIndex;
          const isBelow = curIndex > nriIndex;

          if (isBetween) {
            for (const k in next)
              if (typeof next[k] === "number" && next[k] > 0)
                next[k] = -next[k];
          } else if (isBelow) {
            for (const k in next)
              if (typeof next[k] === "number" && next[k] < 0)
                next[k] = Math.abs(next[k]);
          }
        }

        // --- Monthly↔Annual mirroring
        if (field.endsWith("Monthly")) {
          if (field === "rateMonthly" && isNum(n))
            next.rateAnnual = roundN(toAnnual(n));
          if (isNum(next.grossMonthly))
            next.grossAnnual = roundN(toAnnual(next.grossMonthly));
        } else if (field.endsWith("Annual")) {
          if (isNum(next.grossAnnual))
            next.grossMonthly = roundN(toMonthly(next.grossAnnual));
        }

        return next;
      });

      // ✅ Auto-update Net Rental Income totals
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

          // Prevent feedback loops
          suppressRef.current = true;
          setAtPath("Income.Net Rental Income", () => structuredClone(totals));
          suppressRef.current = false;
        }
      }
    },
    [fullPath, setAtPath, fullData, GBA, UNITS, roundN]
  );

  /* -------------------- Blur sync -------------------- */
  const handleBlur = useCallback(() => {
    setAtPath(fullPath, (p = {}) => {
      const n = { ...p };
      if (isNum(n.grossAnnual))
        n.grossMonthly = roundN(toMonthly(n.grossAnnual));
      return n;
    });
  }, [fullPath, setAtPath, roundN]);

  return { handleChange, handleBlur };
}
