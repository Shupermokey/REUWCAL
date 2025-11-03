import React from "react";
import { useIncome } from "@/app/providers/IncomeProvider.jsx";
import { LOCKED_INCOME_KEYS } from "@/constants/incomeKeys.js";
import LeafEditor from "./LeafEditor";

/* -------------------------------------------------------------------------- */
/* 🌱 ChildLeaf – provider-based leaf row                                      */
/* -------------------------------------------------------------------------- */
export default function ChildLeaf({
  fullPath,
  label,
  val,
  displayMode,
  metrics,
}) {
  const { deleteItem, addItem } = useIncome();

  return (
    <>
      <div className="sec__values">
        <LeafEditor
          fullPath={fullPath}
          val={val}
          displayMode={displayMode}
          metrics={metrics}
        />
      </div>

      <div className="sec__actions">
        {!LOCKED_INCOME_KEYS.has(label) && (
          <>
            <button className="sub-btn" onClick={() => addItem(fullPath, "Sub")}>
              + Sub
            </button>
            <button className="danger-btn" onClick={() => deleteItem(fullPath)}>
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
}
