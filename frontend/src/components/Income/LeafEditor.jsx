import React from "react";
import { Field } from "./Fields.jsx";
import { isLeaf } from "../../utils/incomeMath.js";
import { newLeaf } from "../../utils/incomeDefaults.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";

/**
 * Display rules (prevents compounding/jumps):
 * - We display using Annual as the base:
 *     Annual display  = stored annual (or monthly*12 if annual missing)
 *     Monthly display = base annual / 12  (or stored monthly if annual missing)
 * - When you edit ANNUAL: write annual=n, monthly=n/12
 * - When you edit MONTHLY: write monthly=n, annual=n*12
 */
export default function LeafEditor({ fullPath, val, setAtPath, groupedView }) {
  const { viewMode } = useIncomeView();

  // Helpers to pick safe display values (avoid showing the "other period" by mistake)
  const pickAnnual = (a, m) => {
    const A = Number(a ?? 0);
    const M = Number(m ?? 0);
    return A !== 0 ? A : M * 12;
  };
  const pickMonthly = (a, m) => {
    const A = Number(a ?? 0);
    const M = Number(m ?? 0);
    return M !== 0 ? M : A / 12;
  };

  const display = {
    grossAnnual: pickAnnual(val.grossAnnual, val.grossMonthly),
    psfAnnual: pickAnnual(val.psfAnnual, val.psfMonthly),
    pUnitAnnual: pickAnnual(val.pUnitAnnual, val.pUnitMonthly),

    grossMonthly: pickMonthly(val.grossAnnual, val.grossMonthly),
    psfMonthly: pickMonthly(val.psfAnnual, val.psfMonthly),
    pUnitMonthly: pickMonthly(val.pUnitAnnual, val.pUnitMonthly),
  };

  // Write-through updater based on the field the user actually edited
  const commit = (period, key, rawValue) => {
    const n = Number.isFinite(rawValue) ? rawValue : 0;

    const A = { gross: "grossAnnual", psf: "psfAnnual", punit: "pUnitAnnual" };
    const M = { gross: "grossMonthly", psf: "psfMonthly", punit: "pUnitMonthly" };

    setAtPath(fullPath, (prev) => {
      const leaf = isLeaf(prev) ? { ...prev } : newLeaf();
      if (period === "annual") {
        leaf[A[key]] = n;
        leaf[M[key]] = n / 12;
      } else {
        leaf[M[key]] = n;
        leaf[A[key]] = n * 12;
      }
      return leaf;
    });
  };

  if (groupedView) {
    const isAnnual = viewMode === "annual";
    return (
      <div className="group-card">
        <div className="group-title">{isAnnual ? "Annual" : "Monthly"}</div>
        <div className="group-grid">
          <Field
            label={isAnnual ? "Gross Annual" : "Gross Monthly"}
            value={isAnnual ? display.grossAnnual : display.grossMonthly}
            onChange={(n) => commit(isAnnual ? "annual" : "monthly", "gross", n)}
          />
          <Field
            label="PSF"
            value={isAnnual ? display.psfAnnual : display.psfMonthly}
            onChange={(n) => commit(isAnnual ? "annual" : "monthly", "psf", n)}
          />
          <Field
            label="PUnit"
            value={isAnnual ? display.pUnitAnnual : display.pUnitMonthly}
            onChange={(n) => commit(isAnnual ? "annual" : "monthly", "punit", n)}
          />
        </div>
      </div>
    );
  }

  // Compact view: both sides visible — update based on the side you edit.
  return (
    <div className="six-col-inputs">
      {/* Annual trio (display from annual base) */}
      <Field
        label="Gross Annual"
        value={display.grossAnnual}
        onChange={(n) => commit("annual", "gross", n)}
      />
      <Field
        label="PSF (Annual)"
        value={display.psfAnnual}
        onChange={(n) => commit("annual", "psf", n)}
      />
      <Field
        label="PUnit (Annual)"
        value={display.pUnitAnnual}
        onChange={(n) => commit("annual", "punit", n)}
      />

      {/* Monthly trio (display derived from the same annual base) */}
      <Field
        label="Gross Monthly"
        value={display.grossMonthly}
        onChange={(n) => commit("monthly", "gross", n)}
      />
      <Field
        label="PSF (Monthly)"
        value={display.psfMonthly}
        onChange={(n) => commit("monthly", "psf", n)}
      />
      <Field
        label="PUnit (Monthly)"
        value={display.pUnitMonthly}
        onChange={(n) => commit("monthly", "punit", n)}
      />
    </div>
  );
}
