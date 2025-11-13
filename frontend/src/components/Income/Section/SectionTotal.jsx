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

  const fmt = (n) => {
    if (!Number.isFinite(n)) return "";
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return n < 0 ? `(${formatted})` : formatted;
  };

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  const renderCell = (key, value) => (
    <div
      key={key}
      className={`total-cell ${value < 0 ? "negative" : ""}`}
    >
      {fmt(value)}
    </div>
  );

  const renderValues = () => {
    const cells = [];
    if (showMonthly) {
      cells.push(
        renderCell("rateMonthly", totals.rateMonthly),
        renderCell("grossMonthly", totals.grossMonthly),
        renderCell("psfMonthly", totals.psfMonthly),
        renderCell("punitMonthly", totals.punitMonthly)
      );
    }
    if (showAnnual) {
      cells.push(
        renderCell("rateAnnual", totals.rateAnnual),
        renderCell("grossAnnual", totals.grossAnnual),
        renderCell("psfAnnual", totals.psfAnnual),
        renderCell("punitAnnual", totals.punitAnnual)
      );
    }
    return cells;
  };

  return (
    <div className="sec__totalRow">
      {/* Drag handle placeholder */}
      <div className="sec__firstCell" />

      {/* Label */}
      <div className="sec__label">
        <span className="sec__labelText sec__labelText--total">
          Total {title ?? "Section"}
        </span>
      </div>

      {/* Values - using display: contents wrapper */}
      <div className="sec__values">
        {renderValues()}
      </div>

      {/* Actions placeholder */}
      <div className="sec__actions" />
    </div>
  );
}
