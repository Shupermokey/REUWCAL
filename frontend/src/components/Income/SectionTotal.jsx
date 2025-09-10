import React, { useMemo } from "react";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isLeaf = (v) =>
  isObj(v) &&
  ["grossAnnual","psfAnnual","punitAnnual","rateAnnual","grossMonthly","psfMonthly","punitMonthly","rateMonthly"]
    .every((k) => typeof v[k] === "number" || v[k] === "");

const sumNode = (node) => {
  const t = {
    grossAnnual:0, psfAnnual:0, punitAnnual:0, rateAnnual:0,
    grossMonthly:0, psfMonthly:0, punitMonthly:0, rateMonthly:0,
  };
  const walk = (n) => {
    if (!isObj(n)) return;
    if (isLeaf(n)) {
      t.grossAnnual  += +n.grossAnnual  || 0;
      t.psfAnnual    += +n.psfAnnual    || 0;
      t.punitAnnual  += +n.punitAnnual  || 0;
      t.rateAnnual   += +n.rateAnnual   || 0;
      t.grossMonthly += +n.grossMonthly || 0;
      t.psfMonthly   += +n.psfMonthly   || 0;
      t.punitMonthly += +n.punitMonthly || 0;
      t.rateMonthly  += +n.rateMonthly  || 0;
      return;
    }
    Object.values(n).forEach(walk);
  };
  walk(node);
  return t;
};

export default function SectionTotal({ data, title }) {
  const { displayMode } = useIncomeView();
  const totals = useMemo(() => sumNode(data), [data]);

  const showAnnual  = displayMode === "annual"  || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";
  const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "");

  return (
    <div className="section-total section-row">
      <span className="caret-spacer" />
      <span className="line-label total-label">Total {title}</span>

      {/* values */}
      {showMonthly && (
        <>
          <div className="total-chip">{fmt(totals.grossMonthly)}</div>
          <div className="total-chip">{fmt(totals.psfMonthly)}</div>
          <div className="total-chip">{fmt(totals.punitMonthly)}</div>
          <div className="total-chip">{fmt(totals.rateMonthly)}</div>
        </>
      )}
      {showAnnual && (
        <>
          <div className="total-chip">{fmt(totals.grossAnnual)}</div>
          <div className="total-chip">{fmt(totals.psfAnnual)}</div>
          <div className="total-chip">{fmt(totals.punitAnnual)}</div>
          <div className="total-chip">{fmt(totals.rateAnnual)}</div>
        </>
      )}

      {/* actions column placeholder */}
      <span />
    </div>
  );
}
