import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { getBaselines } from "../../services/firestoreService";
import CellDetailsPanel from "../../components/CellDetailsPanel";
import columnConfig, { columnOrder, breakdownConfig } from "../../columnConfig";
import { getNodeTotal } from "../../components/CustomBreakdownInputs";
import PropertyIncomeStatement from "../../components/PropertyIncomeStatement";
import IncomeStatement from "../../components/Income/IncomeStatement";
import {
  normalizeRow,
  unwrapValue,
  displayValue,
} from "../../utils/rows/rowHelpers";
import { validateFields } from "../../utils/rows/rowValidation";
import { useRowCalcs } from "../../hooks/useRowCalcs";

function Row({
  row,
  baselines = [],
  handleCellChange,
  onSave,
  onCancel,
  onDelete,
  onSelect,
  isSelected,
  onOpenFiles,
}) {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(row.id === "new");
  const [editableRow, setEditableRow] = useState(normalizeRow(row));
  const [invalidFields, setInvalidFields] = useState([]);
  const [activeColumn, setActiveColumn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // --- rent math hooks (kept as-is) ---
  const RENT_KEYS = new Set(["grossRentalIncome", "psf", "punit", "rate"]);
  const isRentKey = (k) => RENT_KEYS.has(k);
  const toLastEditedKey = (k) => (k === "grossRentalIncome" ? "gross" : k); // maps UI key -> calc key
  const { setLastEdited, recompute } = useRowCalcs();

  const setLocal = (field, value) => {
    setEditableRow((prev) => ({ ...prev, [field]: value }));
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
      const catValue = unwrapValue(editableRow[key]) ?? "";
      return (
        <select
          value={catValue}
          style={{
            border: isInvalid ? "1px solid #e53935" : undefined,
            backgroundColor: isInvalid ? "#ffebee" : undefined,
          }}
          onChange={(e) => {
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
      const readOnly = !!config.readOnly;
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
            readOnly={readOnly}
            value={unwrapValue(editableRow[key]) || ""}
            onChange={(e) => {
              if (readOnly) return;
              setLocal(key, {
                ...(editableRow[key] || {}),
                value: e.target.value,
              });
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // ✅ unwrap one level if present; otherwise empty string
    const currentValue = unwrapValue(editableRow[key]) ?? "";

    return (
      <input
        type={inputType === "number" ? "number" : "text"}
        value={currentValue}
        style={{
          border: isInvalid ? "1px solid #e53935" : undefined,
          backgroundColor: isInvalid ? "#ffebee" : undefined,
        }}
        onChange={(e) => {
          const base =
            typeof editableRow[key] === "object" ? editableRow[key] : {};
          const nextCell = { ...base, value: e.target.value };

          // 1) update local cell immediately
          setLocal(key, nextCell);

          // 2) if this change affects rent math, recompute the linked fields
          if (isRentKey(key) || key === "propertyGBA" || key === "units") {
            if (isRentKey(key)) {
              // remember which rent field the user is driving
              setLastEdited(toLastEditedKey(key)); // "gross"|"psf"|"punit"|"rate"
            }
            // build a 'next row' snapshot with the just-typed value
            const nextRow = { ...editableRow, [key]: nextCell };
            const patch = recompute(nextRow); // returns { grossRentalIncome?, psf?, punit?, rate? } wrapped
            if (patch && Object.keys(patch).length) {
              setEditableRow((prev) => ({ ...prev, ...patch }));
            }
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

  const renderDisplayValue = (key) => {
    const raw = editableRow[key];
    if (key === "Category") {
      const id = unwrapValue(raw);
      const selected = baselines.find((b) => b.id === id);
      return selected?.name ?? id ?? "—";
    }
    return displayValue(raw, columnConfig[key]);
  };

  // --- helper: unwrap a cell/object to a finite number ---
  const asNumber = (cell) => {
    const v = unwrapValue(cell);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // --- numeric data we pass to IncomeStatement for GSR auto-math ---
  const rowDataForIS = useMemo(
    () => ({
      // names IncomeStatement extracts by default:
      grossBuildingAreaSqFt: asNumber(editableRow.propertyGBA), // GBA
      units: asNumber(editableRow.units),                        // Units

      // optional: used by IncomeStatement for BRI example
      bri: asNumber(editableRow.bri),
    }),
    [editableRow]
  );

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
                        const { ok, invalids } = validateFields(
                          editableRow,
                          columnOrder,
                          columnConfig
                        );
                        setInvalidFields(invalids);
                        if (!ok) {
                          alert("Please fix highlighted fields.");
                          return;
                        }
                        onSave(editableRow);
                        setIsEditing(false);
                        setShowDetails(false);
                      }}
                    >
                      ✔
                    </button>
                    <button
                      onClick={() => {
                        if (row.id === "new") onCancel?.();
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
                        setEditableRow(normalizeRow(row));
                        setIsEditing(true);
                      }}
                    >
                      ✏
                    </button>
                    <button onClick={() => onDelete(row.id)}>X</button>
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

      {showDetails && activeColumn && (
        <div style={{ position: "relative", width: "100%" }}>
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
              <IncomeStatement
                rowData={rowDataForIS}   // <<< pass numeric GBA/Units/BRI
                propertyId={row.id}
                onSaveRowValue={(totalIncomeAnnual) => {
                  // keep existing object shape (value + details)
                  const prev = editableRow.incomeStatement || {};
                  const updatedCell = {
                    ...prev,
                    value: totalIncomeAnnual,
                    details: {
                      ...(prev.details || {}),
                      source: "IncomeStatement",
                      lastSyncedAt: new Date().toISOString(),
                    },
                  };

                  // update local row state
                  setEditableRow((prevRow) => ({
                    ...prevRow,
                    incomeStatement: updatedCell,
                  }));

                  // bubble to parent
                  handleCellChange(row.id, "incomeStatement", updatedCell);
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Row;
