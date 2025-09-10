import React from "react";

// helper: convert between annual/monthly
const toMonthly = (n) => (Number.isFinite(+n) ? +n / 12 : 0);
const toAnnual  = (n) => (Number.isFinite(+n) ? +n * 12 : 0);

// which fields live in each view
const M_KEYS = ["rateMonthly", "grossMonthly", "psfMonthly", "punitMonthly"];
const A_KEYS = ["rateAnnual",  "grossAnnual",  "psfAnnual",  "punitAnnual"];

export default function LeafEditor({ fullPath, val, setAtPath, displayMode }) {
  const showAnnual  = displayMode === "annual"  || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  // one handler covers all eight inputs
  const handleChange = (field) => (e) => {
    const raw = e.target.value;
    const n   = raw === "" ? "" : Number(raw);

    setAtPath(fullPath, (prev) => {
      const next = { ...prev, [field]: n };

      // keep counterparts in sync: last edited wins
      // monthly <-> annual by 12x across ALL metrics (Rate, Gross, PSF, PUnit)
      switch (field) {
        case "grossMonthly": next.grossAnnual  = raw === "" ? "" : toAnnual(n);  break;
        case "psfMonthly":   next.psfAnnual    = raw === "" ? "" : toAnnual(n);  break;
        case "punitMonthly": next.punitAnnual  = raw === "" ? "" : toAnnual(n);  break;
        case "rateMonthly":  next.rateAnnual   = raw === "" ? "" : toAnnual(n);  break;

        case "grossAnnual":  next.grossMonthly = raw === "" ? "" : toMonthly(n); break;
        case "psfAnnual":    next.psfMonthly   = raw === "" ? "" : toMonthly(n); break;
        case "punitAnnual":  next.punitMonthly = raw === "" ? "" : toMonthly(n); break;
        case "rateAnnual":   next.rateMonthly  = raw === "" ? "" : toMonthly(n); break;
        default: break;
      }
      return next;
    });
  };

  // a tiny formatter so empty string stays empty while typing
  const valOr0 = (v) => (v === "" || v === undefined || v === null ? "" : v);

  return (
    <div className="leaf-editor">
      {showMonthly && (
        <>
          <input type="number" value={valOr0(val.grossMonthly)} onChange={handleChange("grossMonthly")} />
          <input type="number" value={valOr0(val.psfMonthly)}   onChange={handleChange("psfMonthly")} />
          <input type="number" value={valOr0(val.punitMonthly)} onChange={handleChange("punitMonthly")} />
          <input type="number" value={valOr0(val.rateMonthly)}  onChange={handleChange("rateMonthly")} />
        </>
      )}
      {showAnnual && (
        <>
          <input type="number" value={valOr0(val.grossAnnual)} onChange={handleChange("grossAnnual")} />
          <input type="number" value={valOr0(val.psfAnnual)}   onChange={handleChange("psfAnnual")} />
          <input type="number" value={valOr0(val.punitAnnual)} onChange={handleChange("punitAnnual")} />
          <input type="number" value={valOr0(val.rateAnnual)}  onChange={handleChange("rateAnnual")} />
        </>
      )}
    </div>
  );
}
