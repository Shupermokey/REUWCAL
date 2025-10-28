// components/Income/LeafEditor.jsx
import { useIncomeFieldMath } from "@/hooks/useIncomeFieldMath";
import React, { useEffect, useState, useCallback } from "react";
import "@styles/components/Income/LeafEditor.css";

const isNum = (v) => v !== "" && v != null && Number.isFinite(+v);

// Format numeric → "(1,234)" style
const formatDisplay = (num) => {
  if (num === "" || num == null || isNaN(num)) return "";
  const abs = Math.abs(Number(num)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(${abs})` : abs;
};

// Parse "(1,234)" → -1234
const parseDisplay = (text) => {
  if (typeof text === "number") return text;
  if (!text) return 0;
  const str = String(text);
  const cleaned = str.replace(/[(),\s]/g, "");
  return str.includes("(") ? -Number(cleaned) : Number(cleaned);
};

export default function LeafEditor({
  fullPath,
  val,
  setAtPath,
  displayMode,
  metrics,
  deriveFromMetrics,
  fullData,
}) {
  const { handleChange, handleBlur } = useIncomeFieldMath({
    setAtPath,
    fullPath,
    metrics,
    deriveFromMetrics,
    fullData,
  });

  const [local, setLocal] = useState(val || {});
  const [draft, setDraft] = useState(""); // 🆕 live typing text

  useEffect(() => setLocal(val || {}), [val]);

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  /** Determine sign context */
  const getSignContext = useCallback(() => {
    if (!fullData?.Income) return null;
    const incomeKeys = Object.keys(fullData.Income);
    const currentKey = fullPath.split(".")[1];
    const gsrIndex = incomeKeys.indexOf("Gross Scheduled Rent");
    const nriIndex = incomeKeys.indexOf("Net Rental Income");
    const curIndex = incomeKeys.indexOf(currentKey);
    return {
      isBetween: curIndex > gsrIndex && curIndex < nriIndex,
      isBelow: curIndex > nriIndex,
    };
  }, [fullData, fullPath]);

  /** Enforce negative/positive rule */
  const enforceSign = useCallback(
    (value) => {
      const parsed = parseDisplay(value);
      const ctx = getSignContext();
      if (!ctx) return parsed;
      let n = parsed;
      if (ctx.isBetween && n > 0) n = -n;
      if (ctx.isBelow && n < 0) n = Math.abs(n);
      return n;
    },
    [getSignContext]
  );

  /** Prevent drag handles stealing focus */
  const guard = {
    onPointerDownCapture: (e) => e.stopPropagation(),
    onMouseDownCapture: (e) => e.stopPropagation(),
    onKeyDownCapture: (e) => e.stopPropagation(),
  };

  /** Handle input typing */
  const handleInputChange = (field) => (e) => {
    const raw = e.target.value;
    setDraft(raw); // store the live text the user sees

    const enforced = enforceSign(raw);
    setLocal((prev) => ({ ...prev, [field]: enforced }));
    handleChange(field, enforced);
  };

  const handleInputBlur = (field) => () => {
    setDraft(""); // reset to show formatted number
    handleBlur();
  };

  const renderField = (field) => {
    const valNum = local?.[field];
    const formatted = formatDisplay(valNum);

    // When typing, show raw draft; when not, show formatted
    const displayValue = draft !== "" ? draft : formatted;
    const isNegative = Number(valNum) < 0;

    return (
      <input
        key={field}
        type="text"
        value={displayValue}
        onChange={handleInputChange(field)}
        onBlur={handleInputBlur(field)}
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
