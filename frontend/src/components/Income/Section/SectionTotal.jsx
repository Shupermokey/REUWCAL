// components/Income/SectionTotal.jsx
import React, { useMemo } from "react";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import AccountingNumber from "@/components/common/AccountingNumber";

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

  const showAnnual = displayMode === "annual" || displayMode === "both";
  const showMonthly = displayMode === "monthly" || displayMode === "both";

  const renderCell = (key, value, symbolType = 'none') => (
    <div
      key={key}
      className={`total-cell ${value < 0 ? "negative" : ""}`}
    >
      <AccountingNumber value={value} decimals={2} symbolType={symbolType} />
    </div>
  );

  const renderValues = () => {
    const cells = [];
    if (showMonthly) {
      cells.push(
        renderCell("rateMonthly", totals.rateMonthly, "percent"),
        renderCell("grossMonthly", totals.grossMonthly, "currency"),
        renderCell("psfMonthly", totals.psfMonthly, "psf"),
        renderCell("punitMonthly", totals.punitMonthly, "punit")
      );
    }
    if (showAnnual) {
      cells.push(
        renderCell("rateAnnual", totals.rateAnnual, "percent"),
        renderCell("grossAnnual", totals.grossAnnual, "currency"),
        renderCell("psfAnnual", totals.psfAnnual, "psfyr"),
        renderCell("punitAnnual", totals.punitAnnual, "punityr")
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
