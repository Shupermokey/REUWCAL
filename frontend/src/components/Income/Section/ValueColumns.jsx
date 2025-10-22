import React from "react";
import { useIncomeView } from "../../../app/providers/IncomeViewProvider.jsx";
import "@styles/components/Income/ValueColumns.css"

export default function ValueColumns() {
  const { displayMode } = useIncomeView();

  const showMonthly = displayMode === "monthly" || displayMode === "both";
  const showAnnual = displayMode === "annual" || displayMode === "both";

 return (
  <div className={`value-columns ${displayMode === "both" ? "mode-both" : ""}`}>
    {displayMode !== "annual" && (
      <>
        <span>Rate (Monthly)</span>
        <span>Gross (Monthly)</span>
        <span>PSF (Monthly)</span>
        <span>PUnit (Monthly)</span>
      </>
    )}

    {displayMode !== "monthly" && (
      <>
        <span>Rate (Annual)</span>
        <span>Gross (Annual)</span>
        <span>PSF (Annual)</span>
        <span>PUnit (Annual)</span>
      </>
    )}
  </div>
);

}
