// ViewToggle.jsx (ensure it sets 'active' class)
import React from "react";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";

export default function ViewToggle() {
  const { displayMode, setDisplayMode } = useIncomeView();
  const Btn = ({ mode, children }) => (
    <button
      className={displayMode === mode ? "active" : ""}
      onClick={() => setDisplayMode(mode)}
      type="button"
    >
      {children}
    </button>
  );
  return (
    <div className="view-toggle">
      <Btn mode="monthly">Monthly View</Btn>
      <Btn mode="annual">Annual View</Btn>
      <Btn mode="both">Both</Btn>
    </div>
  );
}
