// ViewToggle.jsx - Enhanced view mode switcher
import React from "react";
import { useIncomeView } from "../../app/providers/IncomeViewProvider.jsx";
import "@/styles/components/Income/ViewToggle.css";

export default function ViewToggle() {
  const { displayMode, setDisplayMode } = useIncomeView();

  const modes = [
    { value: "monthly", label: "Monthly", icon: "📅" },
    { value: "annual", label: "Annual", icon: "📆" },
    { value: "both", label: "Roll-Up", icon: "📊" },
  ];

  return (
    <div className="view-toggle">
      <div className="view-toggle__label">View Mode:</div>
      <div className="view-toggle__buttons">
        {modes.map(({ value, label, icon }) => (
          <button
            key={value}
            className={`view-toggle__btn ${displayMode === value ? "active" : ""}`}
            onClick={() => setDisplayMode(value)}
            type="button"
          >
            <span className="view-toggle__icon">{icon}</span>
            <span className="view-toggle__text">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
