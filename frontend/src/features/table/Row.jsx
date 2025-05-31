import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../app/AuthProvider";
import { getBaselines } from "../../services/firestoreService";
import CellDetailsPanel from "../../components/CellDetailsPanel";
import columnConfig, { columnOrder } from "../../columnConfig";
import { getNodeTotal } from "../../components/CustomBreakdownInputs";

function Row({
  row,
  handleCellChange,
  onSave,
  onDelete,
  onSelect,
  isSelected,
  onOpenFiles,
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(row.id === "new");
  const [editableRow, setEditableRow] = useState({ ...row });
  const [baselines, setBaselines] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);
  const [activeColumn, setActiveColumn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getBaselines(user.uid).then(setBaselines);
  }, [user]);

  const handleChange = (field, value) => {
    setEditableRow((prev) => ({ ...prev, [field]: value }));
    handleCellChange(row.id, field, value);
  };

  const validateFields = () => {
    const invalids = columnOrder.filter((key) => {
      const expected = columnConfig[key]?.type;
      const value = editableRow[key]?.value ?? editableRow[key];
      if (expected === "number") return value === "" || isNaN(Number(value));
      if (expected === "string") return typeof value !== "string";
      return false;
    });
    setInvalidFields(invalids);
    return invalids.length === 0;
  };

  const applyBaseline = (baselineId) => {
    const selectedBaseline = baselines.find((b) => b.id === baselineId);
    if (!selectedBaseline) return;

    const getRate = (name) => {
      const row = selectedBaseline.rows.find((r) => r.name === name);
      return row?.growthRate ? parseFloat(row.growthRate.replace("%", "")) : "";
    };

    const updates = {
      Category: baselineId,
      // baseRentGrowth: getRate("Base Rent (MR) Growth Rate"),
      // vacancyRate: getRate("Vacancy Rate"),
      // propertyTaxExpenses: getRate("Property Tax Expenses"),
      // insurance: getRate("Property Insurance Expenses"),
      // utilities: getRate("Property Utility Expenses"),
      // repairs: getRate("Property Repair Expenses"),
      // cam: getRate("Property CAM Expenses"),
      // management: getRate("Property Management Expenses"),
      // capex: getRate("CAP Ex"),
      baselineSnapshot: selectedBaseline.rows,
    };

    setEditableRow((prev) => ({ ...prev, ...updates }));
    Object.entries(updates).forEach(([k, v]) => handleCellChange(row.id, k, v));
  };

  const handleUpdateFromPanel = (updatedData) => {
    const inputs = updatedData?.customInputsByColumn?.[activeColumn] || [];
    const total = inputs.reduce((sum, node) => sum + getNodeTotal(node), 0);

    const updatedCell = {
      ...editableRow[activeColumn],
      ...updatedData,
      value: total,
    };

    setEditableRow((prev) => ({ ...prev, [activeColumn]: updatedCell }));
    handleCellChange(row.id, activeColumn, updatedCell);
    setShowDetails(false);
  };

  const renderEditableCell = (key) => {
    const config = columnConfig[key];
    const inputType = config?.input;

    if (key === "Category") {
      return (
        <select
          value={editableRow[key] || ""}
          onChange={(e) => {
            handleChange(key, e.target.value);
            applyBaseline(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: "100%" }}
        >
          <option value="">Select a baseline</option>
          {baselines.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name || b.id}
            </option>
          ))}
        </select>
      );
    }

    if (inputType === "custom") {
      return (
        <div
          className="editable-cell"
          onDoubleClick={() => {
            setActiveColumn(key);
            setShowDetails(true);
          }}
        >
          <input
            type="text"
            value={editableRow[key]?.value || ""}
            onChange={(e) =>
              handleChange(key, {
                ...(editableRow[key] || {}),
                value: e.target.value,
                details: editableRow[key]?.details || {},
              })
            }
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // ✅ Fix for showing object value
    const currentValue = typeof editableRow[key] === "object"
      ? editableRow[key]?.value || ""
      : editableRow[key] || "";

    return (
      <input
        type={inputType === "number" ? "number" : "text"}
        value={currentValue}
        onChange={(e) => {
          const rawValue = e.target.value;
          const parsedValue = inputType === "number" ? Number(rawValue) : rawValue;
          const base = typeof editableRow[key] === "object" ? editableRow[key] : {};

          handleChange(key, {
            ...base,
            value: parsedValue,
          });
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

  const renderDisplayValue = (key) => {
    return key === "Category"
      ? baselines.find((b) => b.id === editableRow[key])?.name || "—"
      : editableRow[key]?.value || editableRow[key] || "—";
  };

  return (
    <>
      <div
        className={`row ${isSelected ? "selected" : ""}`}
        onClick={onSelect}
        style={{ cursor: "pointer" }}
      >
        {columnOrder.map((key) => (
          <div
            key={key}
            className={`cell ${key === "EditingTools" ? "editing-tools" : ""}`}
            style={{
              width: columnConfig[key]?.width,
              minWidth: columnConfig[key]?.width,
              maxWidth: columnConfig[key]?.width,
            }}
          >
            {key === "EditingTools" ? (
              <div style={{ display: "flex", gap: "6px" }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        if (validateFields()) {
                          onSave(editableRow);
                          setIsEditing(false);
                          setInvalidFields([]);
                          setShowDetails(false);
                        } else {
                          alert("Please fix the highlighted fields before saving.");
                        }
                      }}
                    >
                      ✔
                    </button>
                    <button
                      onClick={() => {
                        if (row.id === "new") onDelete(row.id);
                        else {
                          setEditableRow({ ...row });
                          setIsEditing(false);
                          setInvalidFields([]);
                          setShowDetails(false);
                        }
                      }}
                    >
                      ✖
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)}>✏</button>
                    <button onClick={() => onDelete(row.id)}>🗑</button>
                    <button onClick={() => onOpenFiles(row.id)}>📁</button>
                  </>
                )}
              </div>
            ) : isEditing ? (
              renderEditableCell(key)
            ) : (
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {renderDisplayValue(key)}
              </span>
            )}
          </div>
        ))}
      </div>

      {showDetails && activeColumn && (
        <div className="expanded-details">
          <CellDetailsPanel
            columnKey={activeColumn}
            data={editableRow[activeColumn] || { value: "", details: {} }}
            propertyId={row.id}
            userId={user?.uid}
            onUpdate={handleUpdateFromPanel}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )}
    </>
  );
}

export default Row;
