// Row.jsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthProvider";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import FileExplorer from "./Sidebar/FileSystem/FileExplorer";
import { useApp } from "../context/AppProvider";
import NestedDropdown from "./NestedDropdown";
import dropdownStructureMap from "../nestedDropdownConfig";

const columnOrder = [
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
  const dropdownRef = useRef(null);
  const { setSelectedPropertyId, setShowFilePanel } = useApp();

  useEffect(() => {
    if (!user) return;
    const fetchBaselines = async () => {
      const querySnapshot = await getDocs(
        collection(db, "users", user.uid, "baselines")
      );
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBaselines(data);
    };
    fetchBaselines();
  }, [user]);

  const handleChange = (field, value) => {
    setEditableRow((prev) => ({ ...prev, [field]: value }));
    handleCellChange(row.id, field, value);
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
            <>
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
              />
              <button
                style={{ marginLeft: 4 }}
                onClick={() => {
                  setOpenDropdownKey(row.id);
                  setActiveColumn(key);
                }}
              >
                🛈
              </button>
              {openDropdownKey === row.id && activeColumn === key && (
                <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 1000 }}>
                  <NestedDropdown
                    visible
                    structure={dropdownStructureMap[key] || []}
                    data={editableRow[key] || { value: "", details: {} }}
                    onDataUpdate={(updated) => handleChange(key, updated)}
                    onRequestClose={() => setOpenDropdownKey(null)}
                  />
                </div>
              )}
            </>
          ) : (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {editableRow[key]?.value || "—"}
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
            <button
              onClick={() => {
                console.log("📁 clicked for propertyId", row.id);
                onOpenFiles(row.id);
              }}
            >
              📁
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Row;