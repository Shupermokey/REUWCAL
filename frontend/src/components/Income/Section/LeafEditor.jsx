// components/Income/LeafEditor.jsx
import { useIncomeFieldMath } from "@/hooks/useIncomeFieldMath";
import React, { useEffect, useState, useCallback } from "react";
import "@styles/components/Income/LeafEditor.css";


export default function LeafEditor({
  fullPath,
  val,
  setAtPath,
  displayMode,
  metrics,
  fullData,
}) {

  const { handleChange } = useIncomeFieldMath({
    setAtPath,
    fullPath,
    metrics,
    fullData,
  });

  const [local, setLocal] = useState(val || {});

  useEffect(() => setLocal(val || {}), [val]);

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";


  /** Prevent drag handles stealing focus */
  const guard = {
    onPointerDownCapture: (e) => e.stopPropagation(),
    onMouseDownCapture: (e) => e.stopPropagation(),
    onKeyDownCapture: (e) => e.stopPropagation(),
  };

  /** Handle input typing */
  const handleInputChange = (field) => (e) => {
    const raw = e.target.value; //This is the value that is changing for a partifular field
    setLocal((prev) => ({ ...prev, [field]: raw }));
    handleChange(field, raw);
  };


  const renderField = (field) => {
    const valNum = local[field];
    const isNegative = Number(valNum) < 0;

    return (
      <input
        key={field}
        value={valNum}
        type="number"
        onChange={handleInputChange(field)}
        className={`leaf-input ${isNegative ? "negative" : ""}`}
        {...guard}
      />
    );
  };

  return (
    <div className="leaf-editor">
      {showMonthly && (
        <>
          {renderField("rateMonthly")}
          {renderField("grossMonthly")}
          {renderField("psfMonthly")}
          {renderField("punitMonthly")}
        </>
      )}
      {showAnnual && (
        <>
          {renderField("rateAnnual")}
          {renderField("grossAnnual")}
          {renderField("psfAnnual")}
          {renderField("punitAnnual")}
        </>
      )}
    </div>
  );
}
