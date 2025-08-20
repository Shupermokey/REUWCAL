import React from "react";
import { ReadOnly } from "./Fields.jsx";
import { sumNode } from "../../utils/incomeMath.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";

export default function BranchTotals({ value, groupedView }) {
  const { viewMode } = useIncomeView();
  const t = sumNode(value);

  if (groupedView) {
    const label = viewMode === "annual" ? "Annual (Subtotal)" : "Monthly (Subtotal)";
    const gross = viewMode === "annual" ? t.grossAnnual : t.grossMonthly;
    const psf   = viewMode === "annual" ? t.psfAnnual   : t.psfMonthly;
    const punit = viewMode === "annual" ? t.pUnitAnnual : t.pUnitMonthly;
    return (
      <div className="group-card totals-card">
        <div className="group-title">{label}</div>
        <div className="group-grid">
          <ReadOnly label={viewMode === "annual" ? "Gross Annual" : "Gross Monthly"} value={gross} />
          <ReadOnly label="PSF" value={psf} />
          <ReadOnly label="PUnit" value={punit} />
        </div>
      </div>
    );
  }

  return (
    <div className="six-col-inputs totals-row">
      <ReadOnly label="Gross Annual" value={t.grossAnnual} />
      <ReadOnly label="PSF (Annual)" value={t.psfAnnual} />
      <ReadOnly label="PUnit (Annual)" value={t.pUnitAnnual} />
      <ReadOnly label="Gross Monthly" value={t.grossMonthly} />
      <ReadOnly label="PSF (Monthly)" value={t.psfMonthly} />
      <ReadOnly label="PUnit (Monthly)" value={t.pUnitMonthly} />
    </div>
  );
}
