import { LOCKED_INCOME_KEYS } from "@/constants/incomeKeys.js";
import LeafEditor from "./LeafEditor";

export default function ChildLeaf({
  full,
  label,
  val,
  displayMode,
  metrics,
  handleSetAtPath,
  handlePromote,
  handleDelete,
  fullData, // new
}) {
  return (
    <>
      <div className="sec__values">
        <LeafEditor
          fullPath={full}
          val={val}
          setAtPath={handleSetAtPath}
          displayMode={displayMode}
          metrics={metrics}
          fullData={fullData} // passes whole Income object
        />
      </div>

      <div className="sec__actions">
        {!LOCKED_INCOME_KEYS.has(label) && (
          <>
            <button className="sub-btn" onClick={() => handlePromote(full)}>
              + Sub
            </button>
            <button className="danger-btn" onClick={() => handleDelete(full)}>
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
}
