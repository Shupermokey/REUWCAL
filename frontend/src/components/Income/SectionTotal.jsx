// components/Income/SectionTotal.jsx
import React, { useMemo } from "react";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";

export default function SectionTotal({ data, title }) {
  const { displayMode } = useIncomeView();

  const totals = useMemo(() => {
    const t = {
      grossAnnual: 0,
      psfAnnual: 0,
      punitAnnual: 0,
      rateAnnual: 0,
      grossMonthly: 0,
      psfMonthly: 0,
      punitMonthly: 0,
      rateMonthly: 0,
    };

    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      const keys = Object.keys(n);
      const isLeaf = keys.includes("grossAnnual");
      if (isLeaf) {
        Object.entries(n).forEach(([k, v]) => {
          if (k in t) t[k] += Number(v) || 0;
        });
      } else {
        Object.values(n).forEach(walk);
      }
    };

    walk(data);
    return t;
  }, [data]);

  const fmt = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "";

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  const renderValues = () => {
    const cells = [];
    if (showMonthly) {
      cells.push(
        <div key="rateMonthly" className="total-cell">{fmt(totals.rateMonthly)}</div>,
        <div key="grossMonthly" className="total-cell">{fmt(totals.grossMonthly)}</div>,
        <div key="psfMonthly" className="total-cell">{fmt(totals.psfMonthly)}</div>,
        <div key="punitMonthly" className="total-cell">{fmt(totals.punitMonthly)}</div>
      );
    }
    if (showAnnual) {
      cells.push(
        <div key="rateAnnual" className="total-cell">{fmt(totals.rateAnnual)}</div>,
        <div key="grossAnnual" className="total-cell">{fmt(totals.grossAnnual)}</div>,
        <div key="psfAnnual" className="total-cell">{fmt(totals.psfAnnual)}</div>,
        <div key="punitAnnual" className="total-cell">{fmt(totals.punitAnnual)}</div>
      );
    }
    return cells;
  };

  return (
    <div className="sec__totalRow">
      <div className="sec__rowGrid">
        <div className="sec__firstCell" />
        <div className="sec__label">
          <span className="sec__labelText">
            Total {title ?? "Section"}
          </span>
        </div>
        <div className={`sec__values mode-${displayMode}`}>
          {renderValues()}
        </div>
        <div className="sec__actions" />
      </div>
    </div>
  );
}
