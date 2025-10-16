// src/hooks/useIncomeFieldMath.js
import { useCallback, useEffect } from "react";
import { recalcMetrics } from "@/utils/income"; // existing helper (auto-recalculates PSF/PUnit when GBA/Units change)
import { useRef } from "react";

// Utility checks
const isNum = (v) => v !== "" && v != null && Number.isFinite(+v);
const toMonthly = (n) => (isNum(n) ? +n / 12 : 0);
const toAnnual = (n) => (isNum(n) ? +n * 12 : 0);

// Optional precision — pass precision={2} or 0 for no rounding
const makeRoundN =
  (precision = 2) =>
  (n) =>
    isNum(n)
      ? precision === 0
        ? +n
        : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)
      : n;

export function useIncomeFieldMath({
  setAtPath,
  fullPath,
  metrics,
  deriveFromMetrics,
  precision = 2, // 👈 configurable rounding
}) {
  const GBA = Number(metrics?.gbaSqft) || 0;
  const UNITS = Number(metrics?.units) || 0;
  const roundN = makeRoundN(precision);

  /* ------------------------- Auto-sync on GBA/Units change ------------------------- */
  const prevMetricsRef = useRef({ GBA, UNITS });

  useEffect(() => {
    if (!deriveFromMetrics) return;

    const prevMetrics = prevMetricsRef.current;
    const metricsChanged =
      prevMetrics.GBA !== GBA || prevMetrics.UNITS !== UNITS;

    if (metricsChanged) {
      prevMetricsRef.current = { GBA, UNITS };
      setAtPath(fullPath, (prev = {}) => recalcMetrics(prev, { GBA, UNITS }));
    }
  }, [GBA, UNITS, deriveFromMetrics]);

  /* ------------------------------- Core math helpers ------------------------------- */
  const fromMonthlyGross = useCallback(
    (next) => {
      const g = next.grossMonthly;
      if (!deriveFromMetrics) return;
      if (isNum(g) && GBA > 0) next.psfMonthly = roundN(g / GBA);
      if (isNum(g) && UNITS > 0) next.punitMonthly = roundN(g / UNITS);
    },
    [GBA, UNITS, deriveFromMetrics, roundN]
  );

  /* ----------------------------- Input event handlers ------------------------------ */
  const handleChange = useCallback(
    (field, raw) => {
      const n = raw === "" ? "" : Number(raw);

      setAtPath(fullPath, (prev = {}) => {
        const next = { ...prev, [field]: n };

        // MONTHLY FIELDS
        if (field.endsWith("Monthly")) {
          if (deriveFromMetrics && (GBA > 0 || UNITS > 0)) {
            if (field === "grossMonthly") fromMonthlyGross(next);
            else if (field === "psfMonthly" && GBA > 0)
              next.grossMonthly = roundN(n * GBA);
            else if (field === "punitMonthly" && UNITS > 0)
              next.grossMonthly = roundN(n * UNITS);
          }

          if (field === "rateMonthly" && isNum(n))
            next.rateAnnual = roundN(toAnnual(n));

          // mirror monthly → annual
          if (isNum(next.grossMonthly))
            next.grossAnnual = roundN(toAnnual(next.grossMonthly));
          if (isNum(next.psfMonthly))
            next.psfAnnual = roundN(toAnnual(next.psfMonthly));
          if (isNum(next.punitMonthly))
            next.punitAnnual = roundN(toAnnual(next.punitMonthly));
        }

        // ANNUAL FIELDS
        else if (field.endsWith("Annual")) {
          if (deriveFromMetrics && (GBA > 0 || UNITS > 0)) {
            if (field === "grossAnnual") {
              const g = n;
              next.psfAnnual = isNum(g) && GBA > 0 ? roundN(g / GBA) : "";
              next.punitAnnual = isNum(g) && UNITS > 0 ? roundN(g / UNITS) : "";
            } else if (field === "psfAnnual" && GBA > 0)
              next.grossAnnual = roundN(n * GBA);
            else if (field === "punitAnnual" && UNITS > 0)
              next.grossAnnual = roundN(n * UNITS);
          }
        }

        // RATE FIELDS
        else if (field.startsWith("rate")) {
          if (field.endsWith("Monthly") && isNum(n))
            next.rateAnnual = roundN(toAnnual(n));
          // For annual → monthly, handle on blur
        }

        return next;
      });
    },
    [
      fullPath,
      setAtPath,
      GBA,
      UNITS,
      deriveFromMetrics,
      fromMonthlyGross,
      roundN,
    ]
  );

  const handleBlur = useCallback(() => {
    setAtPath(fullPath, (prev = {}) => {
      const next = { ...prev };

      // mirror annual → monthly
      if (isNum(next.grossAnnual))
        next.grossMonthly = roundN(toMonthly(next.grossAnnual));
      if (isNum(next.psfAnnual))
        next.psfMonthly = roundN(toMonthly(next.psfAnnual));
      if (isNum(next.punitAnnual))
        next.punitMonthly = roundN(toMonthly(next.punitAnnual));
      if (isNum(next.rateAnnual))
        next.rateMonthly = roundN(toMonthly(next.rateAnnual));

      // mirror monthly → annual for consistency
      if (isNum(next.grossMonthly))
        next.grossAnnual = roundN(toAnnual(next.grossMonthly));
      if (isNum(next.psfMonthly))
        next.psfAnnual = roundN(toAnnual(next.psfMonthly));
      if (isNum(next.punitMonthly))
        next.punitAnnual = roundN(toAnnual(next.punitMonthly));

      return next;
    });
  }, [fullPath, setAtPath, roundN]);

  return { handleChange, handleBlur };
}
