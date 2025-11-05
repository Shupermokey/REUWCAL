import React from "react";
import ViewToggle from "./ViewToggle.jsx"; // ⬅️ add this

import "@/styles/components/Income/HeaderBar.css";

export default function HeaderBar({ saving, onSave }) {
  return (
    <div className="income-header">
      <div className="title">
        <span role="img" aria-label="chart">📊</span> Income Statement
      </div>

      <div className="header-actions">
        <ViewToggle />

        <button className="btn-save" disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
      </div>
    </div>
  );
}