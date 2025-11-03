import React from "react";
import { useIncome } from "@/app/providers/IncomeProvider";

export default function LeafEditor({ fullPath, val, displayMode, metrics }) {
  const { updateField } = useIncome();

  const handle = (field) => (e) =>
    updateField(fullPath, field, e.target.value, metrics);

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  const render = (f) => (
    <input
      key={f}
      type="number"
      value={val?.[f] ?? ""}
      onChange={handle(f)}
      className="leaf-input"
    />
  );

  return (
    <div className="leaf-editor">
      {showMonthly &&
        ["rateMonthly", "grossMonthly", "psfMonthly", "punitMonthly"].map(render)}
      {showAnnual &&
        ["rateAnnual", "grossAnnual", "psfAnnual", "punitAnnual"].map(render)}
    </div>
  );
}
