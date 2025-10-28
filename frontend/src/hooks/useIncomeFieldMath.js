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
      ? p === 0
        ? +n
        : Math.round(n * Math.pow(10, p)) / Math.pow(10, p)
      : n;

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

  // ───────── auto-recalc when GBA / Units change
  useEffect(() => {
    if (!deriveFromMetrics) return;
    const prev = prevMetricsRef.current;
    if (prev.GBA !== GBA || prev.UNITS !== UNITS) {
      prevMetricsRef.current = { GBA, UNITS };
      setAtPath(fullPath, (p = {}) => recalcMetrics(p, { GBA, UNITS }));
    }
  }, [GBA, UNITS, deriveFromMetrics]);

  const flipNegative = (o) => {
    for (const k in o) if (typeof o[k] === "number" && o[k] > 0) o[k] = -o[k];
  };
  const flipPositive = (o) => {
    for (const k in o)
      if (typeof o[k] === "number" && o[k] < 0) o[k] = Math.abs(o[k]);
  };

const handleChange = useCallback(
  (field, raw) => {
    const n = raw === "" ? "" : Number(raw);
    console.groupCollapsed(
      `%c[handleChange] %c${fullPath} → ${field}=${n}`,
      "color: #999",
      "color: dodgerblue; font-weight:600;"
    );

    setAtPath(fullPath, (prev = {}) => {
      const next = { ...prev, [field]: n };

      console.log("Prev:", prev);
      console.log("Next (before sign logic):", next);

      // ---------- 🔹 Robust sign enforcement ----------
      const enforceLiveSign = () => {
        const pathParts = fullPath.split(".");
        if (pathParts[0] !== "Income") return;
        const incomeKeys = Object.keys(fullData || {});
        const currentKey = pathParts[1];
        const gsrIndex = incomeKeys.indexOf(FIXED_FIRST_INCOME_KEY);
        const nriIndex = incomeKeys.indexOf(FIXED_DIVIDER_INCOME_KEY);
        const curIndex = incomeKeys.indexOf(currentKey);

        const isBetween =
          gsrIndex >= 0 && nriIndex >= 0 && curIndex > gsrIndex && curIndex < nriIndex;
        const isBelow = nriIndex >= 0 && curIndex > nriIndex;

        console.log("  Context:", {
          currentKey,
          curIndex,
          gsrIndex,
          nriIndex,
          isBetween,
          isBelow,
        });

        if (isBetween) {
          for (const k in next)
            if (typeof next[k] === "number" && next[k] > 0) next[k] = -next[k];
          console.log("  ➤ flipped NEGATIVE", next);
        } else if (isBelow) {
          for (const k in next)
            if (typeof next[k] === "number" && next[k] < 0)
              next[k] = Math.abs(next[k]);
          console.log("  ➤ flipped POSITIVE", next);
        } else {
          console.log("  ➤ No sign flip applied");
        }
      };

      enforceLiveSign();

      // ---------- 🔹 Normal math mirroring ----------
      const G = GBA,
        U = UNITS;
      if (field.endsWith("Monthly")) {
        if (deriveFromMetrics && (G > 0 || U > 0)) {
          if (field === "grossMonthly") {
            const g = n;
            if (isNum(g) && G > 0) next.psfMonthly = roundN(g / G);
            if (isNum(g) && U > 0) next.punitMonthly = roundN(g / U);
          } else if (field === "psfMonthly" && G > 0)
            next.grossMonthly = roundN(n * G);
          else if (field === "punitMonthly" && U > 0)
            next.grossMonthly = roundN(n * U);
        }
        if (field === "rateMonthly" && isNum(n))
          next.rateAnnual = roundN(toAnnual(n));
        if (isNum(next.grossMonthly))
          next.grossAnnual = roundN(toAnnual(next.grossMonthly));
        if (isNum(next.psfMonthly))
          next.psfAnnual = roundN(toAnnual(next.psfMonthly));
        if (isNum(next.punitMonthly))
          next.punitAnnual = roundN(toAnnual(next.punitMonthly));
      } else if (field.endsWith("Annual")) {
        if (deriveFromMetrics && (G > 0 || U > 0)) {
          if (field === "grossAnnual") {
            const g = n;
            next.psfAnnual = isNum(g) && G > 0 ? roundN(g / G) : "";
            next.punitAnnual = isNum(g) && U > 0 ? roundN(g / U) : "";
          } else if (field === "psfAnnual" && G > 0)
            next.grossAnnual = roundN(n * G);
          else if (field === "punitAnnual" && U > 0)
            next.grossAnnual = roundN(n * U);
        }
      }

      console.log("Next (after math):", next);
      console.groupEnd();
      return next;
    });
  },
  [fullPath, setAtPath, GBA, UNITS, deriveFromMetrics, roundN, fullData]
);




  const handleBlur = useCallback(() => {
    setAtPath(fullPath, (p = {}) => {
      const n = { ...p };
      if (isNum(n.grossAnnual))
        n.grossMonthly = roundN(toMonthly(n.grossAnnual));
      if (isNum(n.psfAnnual)) n.psfMonthly = roundN(toMonthly(n.psfAnnual));
      if (isNum(n.punitAnnual))
        n.punitMonthly = roundN(toMonthly(n.punitAnnual));
      if (isNum(n.rateAnnual)) n.rateMonthly = roundN(toMonthly(n.rateAnnual));
      return n;
    });
  }, [fullPath, setAtPath, roundN]);

  return { handleChange, handleBlur };
}
