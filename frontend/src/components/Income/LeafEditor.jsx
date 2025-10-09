// components/Income/LeafEditor.jsx
import React, { useEffect } from "react";

const isNum = (v) => v !== "" && v != null && Number.isFinite(+v);
const roundN = (n, d = 4) => (isNum(n) ? Number((+n).toFixed(d)) : n);
const toMonthly = (n) => (Number.isFinite(+n) ? +n / 12 : 0);
const toAnnual  = (n) => (Number.isFinite(+n) ? +n * 12 : 0);

export default function LeafEditor({
  fullPath,
  val,
  setAtPath,
  displayMode,
  metrics,             // { gbaSqft, units }
  deriveFromMetrics,   // boolean – enable rent⇄psf⇄punit logic
}) {
  const showAnnual  = displayMode === "annual"  || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  // ✅ metrics are ONLY read inside the component
  const GBA   = Number(metrics?.gbaSqft) || 0;
  const UNITS = Number(metrics?.units)   || 0;

  // --- helpers that work in "monthly space" as the source of truth
  const fromMonthlyGross = (next) => {
    const g = next.grossMonthly;
    next.psfMonthly   = isNum(g) && GBA   > 0 ? roundN(g / GBA)   : "";
    next.punitMonthly = isNum(g) && UNITS > 0 ? roundN(g / UNITS) : "";
  };

  const fromMonthlyPSF = (next) => {
    const p = next.psfMonthly;
    if (isNum(p) && GBA > 0) {
      next.grossMonthly = roundN(p * GBA);
      next.punitMonthly = UNITS > 0 ? roundN(next.grossMonthly / UNITS) : "";
    } else {
      next.grossMonthly = "";
      next.punitMonthly = "";
    }
  };

  const fromMonthlyPUnit = (next) => {
    const u = next.punitMonthly;
    if (isNum(u) && UNITS > 0) {
      next.grossMonthly = roundN(u * UNITS);
      next.psfMonthly   = GBA > 0 ? roundN(next.grossMonthly / GBA) : "";
    } else {
      next.grossMonthly = "";
      next.psfMonthly   = "";
    }
  };

  const mirrorAnnualFromMonthly = (next) => {
    next.grossAnnual  = isNum(next.grossMonthly)  ? roundN(toAnnual(next.grossMonthly))  : "";
    next.psfAnnual    = isNum(next.psfMonthly)    ? roundN(toAnnual(next.psfMonthly))    : "";
    next.punitAnnual  = isNum(next.punitMonthly)  ? roundN(toAnnual(next.punitMonthly))  : "";
    if (isNum(next.rateMonthly)) next.rateAnnual = roundN(toAnnual(next.rateMonthly));
  };

  const normalizeMonthlyFromAnnual = (next) => {
    if (isNum(next.grossAnnual))  next.grossMonthly  = roundN(toMonthly(next.grossAnnual));
    if (isNum(next.psfAnnual))    next.psfMonthly    = roundN(toMonthly(next.psfAnnual));
    if (isNum(next.punitAnnual))  next.punitMonthly  = roundN(toMonthly(next.punitAnnual));
    if (isNum(next.rateAnnual))   next.rateMonthly   = roundN(toMonthly(next.rateAnnual));
  };

  const handleChange = (field) => (e) => {
    const raw = e.target.value;
    const n   = raw === "" ? "" : Number(raw);

    setAtPath(fullPath, (prev = {}) => {
      const next = { ...prev, [field]: n };

      // 1) normalize to monthly if the user typed in annual
      if (field.endsWith("Annual")) normalizeMonthlyFromAnnual(next);

      // 2) auto-math using GBA/Units if enabled for this line
      if (deriveFromMetrics && (GBA > 0 || UNITS > 0)) {
        if (field === "grossMonthly" || field === "grossAnnual") {
          fromMonthlyGross(next);
        } else if (field === "psfMonthly" || field === "psfAnnual") {
          fromMonthlyPSF(next);
        } else if (field === "punitMonthly" || field === "punitAnnual") {
          fromMonthlyPUnit(next);
        }
        // rate does not drive others
      }

      // 3) mirror monthly → annual for display
      mirrorAnnualFromMonthly(next);
      return next;
    });
  };

  // 🔁 Optional: re-calc PSF/PUnit when GBA/Units change after Gross is set
  useEffect(() => {
    if (!deriveFromMetrics) return;
    if (!(GBA > 0 || UNITS > 0)) return;

    setAtPath(fullPath, (prev = {}) => {
      const next = { ...prev };

      // prefer monthly; derive it if only annual exists
      if (!isNum(next.grossMonthly) && isNum(next.grossAnnual)) {
        next.grossMonthly = roundN(next.grossAnnual / 12);
      }
      if (!isNum(next.grossMonthly)) return prev;

      fromMonthlyGross(next);
      mirrorAnnualFromMonthly(next);

      const unchanged =
        next.psfMonthly   === prev.psfMonthly &&
        next.punitMonthly === prev.punitMonthly &&
        next.psfAnnual    === prev.psfAnnual &&
        next.punitAnnual  === prev.punitAnnual;

      return unchanged ? prev : next;
    });
  }, [GBA, UNITS, deriveFromMetrics, fullPath, setAtPath]);

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
          <input type="number" value={v("rateMonthly")}  onChange={handleChange("rateMonthly")}  {...guard} />
          <input type="number" value={v("grossMonthly")} onChange={handleChange("grossMonthly")} {...guard} />
          <input type="number" value={v("psfMonthly")}   onChange={handleChange("psfMonthly")}   {...guard} />
          <input type="number" value={v("punitMonthly")} onChange={handleChange("punitMonthly")} {...guard} />
        </>
      )}
      {showAnnual && (
        <>
          <input type="number" value={v("rateAnnual")}   onChange={handleChange("rateAnnual")}   {...guard} />
          <input type="number" value={v("grossAnnual")}  onChange={handleChange("grossAnnual")}  {...guard} />
          <input type="number" value={v("psfAnnual")}    onChange={handleChange("psfAnnual")}    {...guard} />
          <input type="number" value={v("punitAnnual")}  onChange={handleChange("punitAnnual")}  {...guard} />
        </>
      )}
    </div>
  );
}
