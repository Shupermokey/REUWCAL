// ✅ components/Income/Section/ChildLeaf.jsx
import React from "react";
import LeafEditor from "./LeafEditor.jsx";

export default function ChildLeaf({
  full,
  val,
  displayMode,
  metrics,
  handleSetAtPath,
  handlePromote,
  handleDelete,
}) {
  return (
    <>
      {/* ✅ only inputs + actions, NOT a full .sec__rowGrid */}
      <div className="sec__values">
        <LeafEditor
          fullPath={full}
          val={val}
          setAtPath={handleSetAtPath}
          displayMode={displayMode}
          metrics={metrics}
          deriveFromMetrics={true}
        />
      </div>

      <div className="sec__actions">
        <button className="sub-btn" onClick={() => handlePromote(full)}>
          + Sub
        </button>
        <button className="danger-btn" onClick={() => handleDelete(full)}>
          Delete
        </button>
      </div>
    </>
  );
}
