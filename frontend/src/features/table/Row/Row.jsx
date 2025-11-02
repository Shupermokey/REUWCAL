import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { normalizeRow, unwrapValue, displayValue } from "@/utils/rows/rowHelpers";
import { validateFields } from "@/utils/rows/rowValidation";
import { useRowCalcs } from "@/hooks/useRowCalcs";
import IncomeStatement from "@/components/Income/IncomeStatement";
import columnConfig, { columnOrder } from "@/constants/columnConfig";

// ✅ Scoped CSS
import "@/styles/components/Table/Row.css";
import { HEADER_KEYS } from "@/constants";

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
      Object.entries(updates).forEach(([k, v]) => handleCellChange(row.id, k, v));
    },
    [baselines, handleCellChange, row.id]
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
    [editableRow, isRentKey, recompute, setLastEdited, setLocal, toLastEditedKey]
  );

  /* ---------------------------- Render helpers ---------------------------- */
  const renderEditableCell = useCallback(
    (key) => {
      const config = columnConfig[key];
      const inputType = config?.input;
      const isInvalid = invalidFields.includes(key);

      if (key === HEADER_KEYS.CATEGORY) {
        const catValue = unwrapValue(editableRow[key]) ?? "";
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
            className={`row__editable ${isInvalid ? "row__editable--invalid" : ""}`}
            onDoubleClick={() => {
              setActiveColumn(key);
              setShowDetails(true);
            }}
          >
            <input
              type="text"
              readOnly={readOnly}
              value={unwrapValue(editableRow[key]) || ""}
              onChange={(e) => handleInputChange(key, e)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      }

      const currentValue = unwrapValue(editableRow[key]) ?? "";
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
    (key) => {
      const raw = editableRow[key];
      if (key === HEADER_KEYS.CATEGORY) {
        const id = unwrapValue(raw);
        const selected = baselines.find((b) => b.id === id);
        return selected?.name ?? id ?? "—";
      }
      return displayValue(raw, columnConfig[key]);
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
    const { ok, invalids } = validateFields(editableRow, columnOrder, columnConfig);
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
      <div className={`row ${isSelected ? "row--selected" : ""}`} onClick={onSelect}>
        {columnOrder.map((key) => (
          <div
            key={key}
            className={`row__cell ${key === "EditingTools" ? "row__cell--tools" : ""}`}
            style={{
              width: columnConfig[key]?.width,
              minWidth: columnConfig[key]?.width,
              maxWidth: columnConfig[key]?.width,
            }}
          >
            {key === HEADER_KEYS.EDITING_TOOLS ? (
              <div className="row__actions">
                {isEditing ? (
                  <>
                    <button className="row__btn row__btn--save" onClick={handleSaveClick}>
                      ✔
                    </button>
                    <button className="row__btn row__btn--cancel" onClick={handleCancelClick}>
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
            ) :
             isEditing ?
              (
              renderEditableCell(key)
            ) : 
            (
              <span className="row__value">{renderDisplayValue(key)}</span>
            )}

          </div>
        ))}
      </div>

      {showDetails && activeColumn === "incomeStatement" && (
        <div className="row__details">
          <IncomeStatement propertyId={row.id} rowData={rowDataForIS} />
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
