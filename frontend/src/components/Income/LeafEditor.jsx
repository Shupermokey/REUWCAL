// components/Income/LeafEditor.jsx
import { useIncomeFieldMath } from "@/hooks/useIncomeFieldMath";
import React, { useEffect } from "react";

//CSS
import "@styles/components/Income/Section/LeafEditor/LeafEditor.css";


const isNum = (v) => v !== "" && v != null && Number.isFinite(+v);
const roundN = (n) => (isNum(n) ? Math.round(n * 100) / 100 : n);
const toMonthly = (n) => (Number.isFinite(+n) ? +n / 12 : 0);
const toAnnual = (n) => (Number.isFinite(+n) ? +n * 12 : 0);

export default function LeafEditor({
  fullPath,
  val,
  setAtPath,
  displayMode,
  metrics, // { gbaSqft, units }
  deriveFromMetrics, // boolean – enable rent⇄psf⇄punit logic
}) {
  const { handleChange, handleBlur } = useIncomeFieldMath({
    setAtPath,
    fullPath,
    metrics,
    deriveFromMetrics,
  });

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  // ✅ metrics are ONLY read inside the component
  const GBA = Number(metrics?.gbaSqft) || 0;
  const UNITS = Number(metrics?.units) || 0;


  const v = (k) => (val?.[k] === "" || val?.[k] == null ? "" : val[k]);

  // prevent dnd-kit from stealing focus
  const guard = {
    onPointerDownCapture: (e) => e.stopPropagation(),
    onMouseDownCapture: (e) => e.stopPropagation(),
    onKeyDownCapture: (e) => e.stopPropagation(),
  };

  return (
    <div className="leaf-editor">
      {showMonthly && (
        <>
          <input
            type="number"
            value={v("rateMonthly")}
            onChange={(e) => handleChange("rateMonthly", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
          <input
            type="number"
            value={v("grossMonthly")}
            onChange={(e) => handleChange("grossMonthly", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
          <input
            type="number"
            value={v("psfMonthly")}
            onChange={(e) => handleChange("psfMonthly", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
          <input
            type="number"
            value={v("punitMonthly")}
            onChange={(e) => handleChange("punitMonthly", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
        </>
      )}
      {showAnnual && (
        <>
          <input
            type="number"
            value={v("rateAnnual")}
            onChange={(e) => handleChange("rateAnnual", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
          <input
            type="number"
            value={v("grossAnnual")}
            onChange={(e) => handleChange("grossAnnual", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
          <input
            type="number"
            value={v("psfAnnual")}
            onChange={(e) => handleChange("psfAnnual", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
          <input
            type="number"
            value={v("punitAnnual")}
            onChange={(e) => handleChange("punitAnnual", e.target.value)}
            onBlur={handleBlur}
            {...guard}
          />
        </>
      )}
    </div>
  );
}
