import React from "react";
import ViewToggle from "./ViewToggle.jsx"; // ⬅️ add this

export default function HeaderBar({ saving, error, lastSavedAt, onSave }) {
  return (
    <div className="income-header">
      <div className="title">
        <span role="img" aria-label="chart">📊</span> Income Statement
      </div>

      <div className="header-actions">
        {/* ⬇️ moved here; replaces the old green buttons */}
        <ViewToggle />

        <button className="btn-save" disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
      </div>
    </div>
  );
}