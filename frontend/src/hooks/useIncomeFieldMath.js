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
        return next;
      });

    },
    [fullPath, setAtPath, fullData, GBA, UNITS, roundN]
  );


 return { handleChange };


}
