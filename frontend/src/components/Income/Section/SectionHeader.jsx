import React from "react";

export default function SectionHeader({ title, onAdd, onCollapseAll, onExpandAll, collapsed, setCollapsed }) {
  return (
    <div className="sec__header">
      <div className="sec__headerGrid">
        <div className="sec__firstCell">
          <button
            className="sec__caret"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "▸" : "▾"}
          </button>
        </div>

        <div className="sec__label">
          <span className="sec__labelText">{title}</span>
        </div>

        <div className="sec__values" />

        <div className="sec__actions sec__headerActions">
          <button className="add-btn" onClick={onAdd}>+ Item</button>
          <button className="add-btn" onClick={onCollapseAll}>Collapse All</button>
          <button className="add-btn" onClick={onExpandAll}>Expand All</button>
        </div>
      </div>
    </div>
  );
}
