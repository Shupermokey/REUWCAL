import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  normalizeRow,
  unwrapValue,
  displayValue,
} from "../../../utils/rows/rowHelpers";
import { validateFields } from "../../../utils/rows/rowValidation";
import { useRowCalcs } from "../../../hooks/useRowCalcs";
import CellDetailsPanel from "../../../components/CellDetailsPanel";
import PropertyIncomeStatement from "../../../components/PropertyIncomeStatement";
import IncomeStatement from "../../../components/Income/IncomeStatement";
import columnConfig, { columnOrder } from "../../../columnConfig";
import { getNodeTotal } from "../../../components/CustomBreakdownInputs";

// ✅ Scoped CSS
import "@/styles/components/Table/Row.css";

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

  /* ---------------------------- Derived utilities ---------------------------- */
  const RENT_KEYS = useMemo(
    () => new Set(["grossRentalIncome", "psf", "punit", "rate"]),
    []
  );
  const isRentKey = useCallback((k) => RENT_KEYS.has(k), [RENT_KEYS]);

  const toLastEditedKey = useCallback(
    (k) => (k === "grossRentalIncome" ? "gross" : k),
    []
  );
  const { setLastEdited, recompute } = useRowCalcs();

  const setLocal = useCallback(
    (field, value) => setEditableRow((prev) => ({ ...prev, [field]: value })),
    []
  );

  /* ----------------------------- Baseline logic ----------------------------- */
  const applyBaseline = useCallback(
    (baselineId) => {
      const selectedBaseline = baselines.find((b) => b.id === baselineId);
      if (!selectedBaseline) return;

      const updates = {
        Category: baselineId,
        baselineSnapshot: selectedBaseline.rows,
      };

      setEditableRow((prev) => ({ ...prev, ...updates }));
      Object.entries(updates).forEach(([k, v]) =>
        handleCellChange(row.id, k, v)
      );
    },
    [baselines, handleCellChange, row.id]
  );

  /* --------------------------- CellDetailsPanel logic --------------------------- */
  const handleUpdateFromPanel = useCallback(
    (updatedData) => {
      const details = updatedData.details || {};
      const column = activeColumn;
      let updatedValue = 0;

      if (column === "propertyAddress") {
        updatedValue = details["Property Address"] || "";
      } else if (column === "propertyGSA") {
        updatedValue = parseFloat(details["Square Feet"]) || 0;
      } else if (column === "propertyGBA") {
        updatedValue =
          parseFloat(details["Gross Building Area (GBA/GLA)"]) || 0;
      } else if (column === "purchasePrice") {
        const numericFields = [
          "Contract Price",
          "Transaction",
          "Due Diligence",
          "Other",
          "Capital To Stabilize",
          "Capital Reserve",
        ];
        const defaultTotal = numericFields.reduce((sum, key) => {
          const val = details[key];
          const parsed = typeof val === "number" ? val : parseFloat(val);
          return !isNaN(parsed) ? sum + parsed : sum;
        }, 0);
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
        updatedValue = inputs.reduce(
          (sum, node) => sum + getNodeTotal(node),
          0
        );
      }

      const updatedCell = { ...updatedData, value: updatedValue };
      setEditableRow((prev) => ({ ...prev, [column]: updatedCell }));
      handleCellChange(row.id, column, updatedCell);
      setShowDetails(false);
    },
    [activeColumn, handleCellChange, row.id]
  );

  /* ---------------------------- Input handling ---------------------------- */
  const handleInputChange = useCallback(
    (key, e) => {
      const config = columnConfig[key];
      const readOnly = !!config?.readOnly;
      if (readOnly) return;

      const base = typeof editableRow[key] === "object" ? editableRow[key] : {};
      const nextCell = { ...base, value: e.target.value };
      setLocal(key, nextCell);

      if (isRentKey(key) || key === "propertyGBA" || key === "units") {
        if (isRentKey(key)) setLastEdited(toLastEditedKey(key));
        const nextRow = { ...editableRow, [key]: nextCell };
        const patch = recompute(nextRow);
        if (patch && Object.keys(patch).length) {
          setEditableRow((prev) => ({ ...prev, ...patch }));
        }
      }
    },
    [
      editableRow,
      isRentKey,
      recompute,
      setLastEdited,
      setLocal,
      toLastEditedKey,
    ]
  );

  /* ---------------------------- Render helpers ---------------------------- */
  const renderEditableCell = useCallback(
    (columnName) => {
      const config = columnConfig[columnName];
      const inputType = config?.input;
      const isInvalid = invalidFields.includes(columnName);

      if (columnName === "Category") {
        const catValue = unwrapValue(editableRow[columnName]) ?? "";
        return (
          <select
            className={`row__input ${isInvalid ? "row__input--invalid" : ""}`}
            value={catValue}
            onChange={(e) => applyBaseline(e.target.value)}
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
            className={`row__editable ${
              isInvalid ? "row__editable--invalid" : ""
            }`}
            onDoubleClick={() => {
              setActiveColumn(columnName);
              setShowDetails(true);
            }}
          >
            <input
              type="text"
              readOnly={readOnly}
              value={unwrapValue(editableRow[columnName]) || ""}
              onChange={(e) => handleInputChange(columnName, e)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      }

      const currentValue = unwrapValue(editableRow[columnName]) ?? "";

      return (
        <input
          className={`row__input ${isInvalid ? "row__input--invalid" : ""}`}
          type={inputType === "number" ? "number" : "text"}
          value={currentValue}
          onChange={(e) => handleInputChange(key, e)}
          onClick={(e) => e.stopPropagation()}
        />
      );
    },
    [applyBaseline, baselines, editableRow, handleInputChange, invalidFields]
  );

  const renderDisplayValue = useCallback(
    (columnName) => {
      const raw = editableRow[columnName];
      if (columnName === "Category") {
        const id = unwrapValue(raw);
        const selected = baselines.find((b) => b.id === id);
        return selected?.name ?? id ?? "—";
      }
      return displayValue(raw, columnConfig[columnName]);
    },
    [editableRow, baselines]
  );

  /* ------------------------- Derived for IncomeStatement ------------------------- */
  const asNumber = useCallback((cell) => {
    const v = unwrapValue(cell);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const rowDataForIS = useMemo(
    () => ({
      grossBuildingAreaSqFt: asNumber(editableRow.propertyGBA),
      units: asNumber(editableRow.units),
    }),
    [editableRow, asNumber]
  );

  /* ------------------------------- Save/Cancel ------------------------------- */
  const handleSaveClick = useCallback(() => {
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
  }, [editableRow, onSave]);

  const handleCancelClick = useCallback(() => {
    if (row.id === "new") onCancel?.();
    else {
      setEditableRow(normalizeRow(row));
      setIsEditing(false);
      setInvalidFields([]);
      setShowDetails(false);
    }
  }, [onCancel, row]);

  /* ------------------------------- Render ------------------------------- */
  return (
    <>
      <div
        className={`row ${isSelected ? "row--selected" : ""}`}
        onClick={onSelect}
      >
        {columnOrder.map((columnName) => (
          <div
            key={columnName}
            className={`row__cell ${
              columnName === "EditingTools" ? "row__cell--tools" : ""
            }`}
            style={{
              width: columnConfig[columnName]?.width,
              minWidth: columnConfig[columnName]?.width,
              maxWidth: columnConfig[columnName]?.width,
            }}
          >
            {columnName === "EditingTools" ? (
              <div className="row__actions">
                {isEditing ? (
                  <>
                    <button
                      className="row__btn row__btn--save"
                      onClick={handleSaveClick}
                    >
                      ✔
                    </button>
                    <button
                      className="row__btn row__btn--cancel"
                      onClick={handleCancelClick}
                    >
                      ✖
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="row__btn row__btn--edit"
                      onClick={() => {
                        setEditableRow(normalizeRow(row));
                        setIsEditing(true);
                      }}
                    >
                      ✏
                    </button>
                    <button
                      className="row__btn row__btn--delete"
                      onClick={() => onDelete(row.id)}
                    >
                      X
                    </button>
                    <button
                      className="row__btn row__btn--files"
                      onClick={() => onOpenFiles(row.id)}
                    >
                      📁
                    </button>
                  </>
                )}
              </div>
            ) : isEditing ? (
              renderEditableCell(columnName)
            ) : (
              <span className="row__value">
                {renderDisplayValue(columnName)}
              </span>
            )}
          </div>
        ))}
      </div>

      {showDetails && activeColumn && (
        <div className="row__details">
          {activeColumn === "incomeStatement" && (
            <IncomeStatement
              rowData={rowDataForIS}
              propertyId={row.id}
              onSaveRowValue={(totalIncomeAnnual) => {
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
                setEditableRow((prevRow) => ({
                  ...prevRow,
                  incomeStatement: updatedCell,
                }));
                handleCellChange(row.id, "incomeStatement", updatedCell);
              }}
              onSaveRowToFirestore={async (propertyId) => {
                const { saveRowData } = await import(
                  "@services/firestore/rowsService.js"
                );
                const flatData = Object.fromEntries(
                  Object.entries(editableRow).map(([key, val]) =>
                    val && typeof val === "object" && "value" in val
                      ? [key, val.value]
                      : [key, val]
                  )
                );
                await saveRowData(user.uid, propertyId, flatData);
                console.log(
                  "✅ Persisted normalized row to Firestore",
                  flatData
                );
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

export default React.memo(Row, (prev, next) => {
  return (
    prev.row === next.row &&
    prev.isSelected === next.isSelected &&
    prev.baselines === next.baselines &&
    prev.handleCellChange === next.handleCellChange
  );
});
