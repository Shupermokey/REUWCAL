import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../app/AuthProvider"; 
import { getBaselines } from "../../services/firestoreService"; 
import NestedDropdown from "../../components/NestedDropdown";
import dropdownStructureMap from "../../nestedDropdownConfig";

export const columnOrder = [
  "propertyAddress",
  "purchasePriceSF",
  "purchasePrice",
  "ACQCAPXSF",
  "ACQCAPX",
  "UnitCount",
  "GrossBuildingArea",
  "GrossSiteArea",
  "REPropertyTax",
  "MarketRate",
  "ServiceStructure",
  "PropertyClass",
  "Category",
];

const columnTypes = {
  propertyAddress: "string",
  purchasePriceSF: "number",
  purchasePrice: "number",
  ACQCAPXSF: "number",
  ACQCAPX: "number",
  UnitCount: "number",
  GrossBuildingArea: "number",
  GrossSiteArea: "number",
  REPropertyTax: "number",
  MarketRate: "number",
  ServiceStructure: "string",
  PropertyClass: "string",
  Category: "string",
};

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
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchBaselinesFromService = async () => {
      const data = await getBaselines(user.uid);
      setBaselines(data);
    };
    fetchBaselinesFromService();
  }, [user]);

  const handleChange = (field, value) => {
    setEditableRow((prev) => ({ ...prev, [field]: value }));
    handleCellChange(row.id, field, value);
  };

  const validateFields = () => {
    const invalids = [];
    Object.entries(columnTypes).forEach(([key, type]) => {
      const value = editableRow[key]?.value ?? editableRow[key];
      if (type === "number" && (value === "" || isNaN(Number(value)))) {
        invalids.push(key);
      }
      if (type === "string" && typeof value !== "string") {
        invalids.push(key);
      }
    });
    setInvalidFields(invalids);
    return invalids.length === 0;
  };

  const handleCancel = () => {
    if (row.id === "new") {
      onDelete(row.id);
    } else {
      setEditableRow({ ...row });
      setIsEditing(false);
      setInvalidFields([]);
    }
  };

  const applyBaseline = (baselineId) => {
    const selectedBaseline = baselines.find((b) => b.id === baselineId);
    if (!selectedBaseline || !selectedBaseline.rows) return;

    const getRate = (name) => {
      const row = selectedBaseline.rows.find((r) => r.name === name);
      return row?.growthRate ? parseFloat(row.growthRate.replace("%", "")) : "";
    };

    const updatedRow = {
      ...editableRow,
      Category: baselineId,
      baseRentGrowth: getRate("Base Rent (MR) Growth Rate"),
      vacancyRate: getRate("Vacancy Rate"),
      propertyTaxExpenses: getRate("Property Tax Expenses"),
      insurance: getRate("Property Insurance Expenses"),
      utilities: getRate("Property Utility Expenses"),
      repairs: getRate("Property Repair Expenses"),
      cam: getRate("Property CAM Expenses"),
      management: getRate("Property Management Expenses"),
      capex: getRate("CAP Ex"),
      baselineSnapshot: selectedBaseline.rows,
    };

    setEditableRow(updatedRow);
    Object.entries(updatedRow).forEach(([key, value]) => {
      handleCellChange(row.id, key, value);
    });
  };

  return (
    <div
      className={`row ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      style={{ cursor: "pointer" }}
    >
      {columnOrder.map((key) => (
        <div
          key={key}
          className="cell"
          style={{ position: "relative", overflow: "visible", zIndex: 2, minWidth: 150 }}
        >
          {isEditing ? (
            key === "Category" ? (
              <div className="editable-cell">
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
                    <option key={b.id} value={b.id}>{b.name || b.id}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div
                  className="editable-cell"
                  onClick={() => {
                    if (clickTimerRef.current) {
                      clearTimeout(clickTimerRef.current);
                      clickTimerRef.current = null;
                    }
                    clickTimerRef.current = setTimeout(() => {
                      clickTimerRef.current = null;
                    }, 200);
                  }}
                  onDoubleClick={() => {
                    clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = null;
                    setOpenDropdownKey(row.id);
                    setActiveColumn(key);
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
                {openDropdownKey === row.id && activeColumn === key && (
                  <NestedDropdown
                    visible
                    structure={dropdownStructureMap[key] || []}
                    data={editableRow[key] || { value: "", details: {} }}
                    columnKey={key}
                    propertyId={row.id}
                    onDataUpdate={(updated) => handleChange(key, updated)}
                    onRequestClose={() => setOpenDropdownKey(null)}
                  />
                )}
              </>
            )
          ) : (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {key === "Category"
                ? baselines.find((b) => b.id === editableRow[key])?.name || "—"
                : editableRow[key]?.value || "—"}
            </span>
          )}
        </div>
      ))}

      <div className="cell">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                if (validateFields()) {
                  onSave(editableRow);
                  setIsEditing(false);
                  setInvalidFields([]);
                } else {
                  alert("Please fix the highlighted fields before saving.");
                }
              }}
            >
              ✔ Save
            </button>
            <button onClick={handleCancel}>✖ Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)}>✏</button>
            <button onClick={() => onDelete(row.id)}>🗑</button>
            <button onClick={() => onOpenFiles(row.id)}>📁</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Row;
