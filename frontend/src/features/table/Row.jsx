import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../app/AuthProvider";
import { getBaselines } from "../../services/firestoreService";
import CellDetailsPanel from "../../components/CellDetailsPanel";
import columnConfig, { columnOrder, breakdownConfig } from "../../columnConfig";
import { getNodeTotal } from "../../components/CustomBreakdownInputs";
import PropertyIncomeStatement from "../../components/PropertyIncomeStatement";

function Row({
  row,
  handleCellChange,
  onSave,
  onDelete,
  onSelect,
  isSelected,
  onOpenFiles,
}) {
  const normalizeRow = (raw) => {
    const wrapped = {};
    for (const [key, val] of Object.entries(raw)) {
      if (key === "id" || key === "baselineSnapshot") {
        wrapped[key] = val;
        continue;
      }
      wrapped[key] =
        typeof val === "object" && val !== null && "value" in val
          ? val
          : { value: val };
    }
    return wrapped;
  };

  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(row.id === "new");
  const [editableRow, setEditableRow] = useState(normalizeRow(row));
  const [baselines, setBaselines] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);
  const [activeColumn, setActiveColumn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

    const updates = {
      Category: baselineId,
      baselineSnapshot: selectedBaseline.rows,
    };

    setEditableRow((prev) => ({ ...prev, ...updates }));
    Object.entries(updates).forEach(([k, v]) => handleCellChange(row.id, k, v));
  };

  const handleUpdateFromPanel = (updatedData) => {
    const details = updatedData.details || {};
    const column = activeColumn;
    let updatedValue = 0;

    const getNumber = (label) => {
      const val = details[label];
      if (typeof val === "number") return val;
      if (typeof val === "string") return parseFloat(val) || 0;
      return 0;
    };

    if (column === "propertyAddress") {
      updatedValue = details["Property Address"] || "";
    } else if (column === "propertyGSA") {
      updatedValue = parseFloat(details["Square Feet"]) || 0;
    } else if (column === "propertyGBA") {
      updatedValue = parseFloat(details["Gross Building Area (GBA/GLA)"]) || 0;
    } else if (column === "purchasePrice") {
      const numericFields = [
        "Contract Price",
        "Transaction",
        "Due Diligence",
        "Other",
        "Capital To Stabilize",
        "Capital Reserve",
      ];

      // Sum default purchase price items
      const defaultTotal = numericFields.reduce((sum, key) => {
        const val = details[key];
        const parsed = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(parsed) ? sum + parsed : sum;
      }, 0);

      // Sum customInputs if they exist
      const customTotal = (updatedData.customInputs || []).reduce(
        (sum, input) => {
          const num = parseFloat(input.value);
          return !isNaN(num) ? sum + num : sum;
        },
        0
      );

      updatedValue = defaultTotal + customTotal;
    } else {
      const inputs = updatedData?.customInputsByColumn?.[column] || [];
      updatedValue = inputs.reduce((sum, node) => sum + getNodeTotal(node), 0);
    }

    const updatedCell = {
      ...updatedData,
      value: updatedValue,
    };

    setEditableRow((prev) => ({
      ...prev,
      [column]: updatedCell,
    }));

    handleCellChange(row.id, column, updatedCell);
    setShowDetails(false);
  };

  const renderEditableCell = (key) => {
    const config = columnConfig[key];
    const inputType = config?.input;
    const isInvalid = invalidFields.includes(key);

    if (key === "Category") {
      return (
        <select
          value={editableRow[key] || ""}
          style={{
            border: isInvalid ? "1px solid #e53935" : undefined,
            backgroundColor: isInvalid ? "#ffebee" : undefined,
          }}
          onChange={(e) => {
            handleChange(key, e.target.value);
            applyBaseline(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
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
          style={{
            border: isInvalid ? "1px solid #e53935" : undefined,
            backgroundColor: isInvalid ? "#ffebee" : undefined,
          }}
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

    const currentValue =
      typeof editableRow[key] === "object"
        ? editableRow[key]?.value || ""
        : editableRow[key] || "";

    return (
      <input
        type={inputType === "number" ? "number" : "text"}
        value={currentValue}
        style={{
          border: isInvalid ? "1px solid #e53935" : undefined,
          backgroundColor: isInvalid ? "#ffebee" : undefined,
        }}
        onChange={(e) => {
          const parsed =
            inputType === "number" ? Number(e.target.value) : e.target.value;
          const base =
            typeof editableRow[key] === "object" ? editableRow[key] : {};
          handleChange(key, { ...base, value: parsed });
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

  const renderDisplayValue = (key) => {
    const val = editableRow[key];

    if (key === "Category") {
      const selected = baselines.find(
        (b) => b.id === val || b.id === val?.value
      );
      return selected?.name || val?.value || val || "—";
    }

    if (val && typeof val === "object" && "value" in val) {
      return val.value;
    }

    return typeof val === "string" || typeof val === "number" ? val : "—";
  };

  return (
    <>
      <div className={`row ${isSelected ? "selected" : ""}`} onClick={onSelect}>
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
                          alert("Please fix highlighted fields.");
                        }
                      }}
                    >
                      ✔
                    </button>
                    <button
                      onClick={() => {
                        if (row.id === "new") onDelete(row.id);
                        else {
                          setEditableRow(normalizeRow(row));
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
                    <button
                      onClick={() => {
                        const normalized = {};
                        columnOrder.forEach((key) => {
                          const val = editableRow[key];
                          normalized[key] =
                            typeof val === "object"
                              ? val
                              : { value: val, details: {} };
                        });
                        setEditableRow(normalized);
                        setIsEditing(true);
                      }}
                    >
                      ✏
                    </button>
                    <button onClick={() => onDelete(row.id)}>🗑</button>
                    <button onClick={() => onOpenFiles(row.id)}>📁</button>
                  </>
                )}
              </div>
            ) : isEditing ? (
              renderEditableCell(key)
            ) : (
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {renderDisplayValue(key)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* {showDetails && activeColumn && (
        <div className="expanded-details">
          <CellDetailsPanel
            columnKey={activeColumn}
            data={{
              ...editableRow[activeColumn],
              details: {
                ...(editableRow[activeColumn]?.details || {}),
                ...Object.fromEntries(
                  Object.entries(editableRow).flatMap(([key, val]) => {
                    if (key === activeColumn) return [];
                    const label = columnConfig[key]?.label || key;
                    const value =
                      typeof val === "object" && val?.value !== undefined
                        ? val.value
                        : val;
                    return [[label, value]];
                  })
                ),
              },
            }}
            propertyId={row.id}
            userId={user?.uid}
            onUpdate={handleUpdateFromPanel}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )} */}

      {showDetails && activeColumn && (
        <div style={{ display: "flex", position: "relative", width: "100%" }}>
          <div className="expanded-details" style={{ flex: 1 }}>
            <CellDetailsPanel
              columnKey={activeColumn}
              data={{
                ...editableRow[activeColumn],
                details: {
                  ...(editableRow[activeColumn]?.details || {}),
                  ...Object.fromEntries(
                    Object.entries(editableRow).flatMap(([key, val]) => {
                      if (key === activeColumn) return [];
                      const label = columnConfig[key]?.label || key;
                      const value =
                        typeof val === "object" && val?.value !== undefined
                          ? val.value
                          : val;
                      return [[label, value]];
                    })
                  ),
                },
              }}
              propertyId={row.id}
              userId={user?.uid}
              onUpdate={handleUpdateFromPanel}
              onClose={() => setShowDetails(false)}
            />
          </div>

          {/* Show income statement only for purchasePrice */}
          {activeColumn === "incomeStatement" && (
            <div
              style={{
                flexBasis: "400px",
                minWidth: "360px",
                borderLeft: "1px solid #ccc",
              }}
            >
              <PropertyIncomeStatement
                rowData={editableRow}
                propertyId={row.id}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Row;
