import React from "react";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";

export default function HeaderBar({ saving, error, lastSavedAt, onSave }) {
  const { viewMode, setViewMode, groupedView, setGroupedView } = useIncomeView();
  return (
    <div className="isp-header">
      <h3>📊 Income Statement</h3>
      <div className="isp-right">
        {saving ? (
          <span className="status-pill is-saving"><span className="dot dot-spin" /> Saving…</span>
        ) : error ? (
          <span className="status-pill is-error"><span className="dot" /> Save failed</span>
        ) : lastSavedAt ? (
          <span className="status-pill is-saved"><span className="dot" /> Saved {lastSavedAt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</span>
        ) : null}

        <button className="btn-save" onClick={() => setViewMode(viewMode === "annual" ? "monthly" : "annual")} disabled={saving}>
          {viewMode === "annual" ? "Monthly View" : "Annual View"}
        </button>
        <button className="btn-save" onClick={() => setGroupedView(!groupedView)} disabled={saving}>
          {groupedView ? "Compact View" : "Grouped View"}
        </button>
        <button className="btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
      </div>
    </div>
  );
}
