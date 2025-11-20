import React, { useMemo } from "react";
import AccountingNumber from "@/components/common/AccountingNumber";
import "@/styles/components/Income/BranchTotals.css";


const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const LEAF_KEYS = [
  "rateAnnual","grossAnnual","psfAnnual","punitAnnual",
  "rateMonthly","grossMonthly","psfMonthly","punitMonthly"
];
const isLeaf = (v) =>
  isObj(v) && LEAF_KEYS.every((k) => typeof v[k] === "number" || v[k] === "");

// depth-first sum
const sumNode = (node) => {
  const t = {
    grossAnnual:0, psfAnnual:0, punitAnnual:0, rateAnnual:0,
    grossMonthly:0, psfMonthly:0, punitMonthly:0, rateMonthly:0,
  };
  const walk = (n) => {
    if (!isObj(n)) return;
    if (isLeaf(n)) {
      t.rateAnnual   += +n.rateAnnual   || 0;
      t.grossAnnual  += +n.grossAnnual  || 0;
      t.psfAnnual    += +n.psfAnnual    || 0;
      t.punitAnnual  += +n.punitAnnual  || 0;
      t.rateMonthly  += +n.rateMonthly  || 0;
      t.grossMonthly += +n.grossMonthly || 0;
      t.psfMonthly   += +n.psfMonthly   || 0;
      t.punitMonthly += +n.punitMonthly || 0;
      return;
    }
    Object.values(n).forEach(walk);
  };
  walk(node);
  return t;
};

export default function BranchTotals({ value, displayMode }) {
  const totals = useMemo(() => sumNode(value), [value]);

  const showAnnual  = displayMode === "annual"  || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  return (
    <>
      {showMonthly && (
        // ORDER: Rate → Gross → PSF → PUnit
        <>
          <div className="total-cell"><AccountingNumber value={totals.rateMonthly} decimals={2} symbolType="percent" /></div>
          <div className="total-cell"><AccountingNumber value={totals.grossMonthly} decimals={2} symbolType="currency" /></div>
          <div className="total-cell"><AccountingNumber value={totals.psfMonthly} decimals={2} symbolType="psf" /></div>
          <div className="total-cell"><AccountingNumber value={totals.punitMonthly} decimals={2} symbolType="punit" /></div>
        </>
      )}
      {showAnnual && (
        // ORDER: Rate → Gross → PSF → PUnit
        <>
          <div className="total-cell"><AccountingNumber value={totals.rateAnnual} decimals={2} symbolType="percent" /></div>
          <div className="total-cell"><AccountingNumber value={totals.grossAnnual} decimals={2} symbolType="currency" /></div>
          <div className="total-cell"><AccountingNumber value={totals.psfAnnual} decimals={2} symbolType="psfyr" /></div>
          <div className="total-cell"><AccountingNumber value={totals.punitAnnual} decimals={2} symbolType="punityr" /></div>
        </>
      )}
    </>
  );
}
