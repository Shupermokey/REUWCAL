import { useEffect, useState } from "react";
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
      const value = editableRow[key];

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
    <div className={`row ${isSelected ? "selected" : ""}`} onClick={onSelect} style={{ cursor: "pointer" }}>
      {columnOrder.map((key) => (
        <div key={key} className="cell" style={{ position: "relative", overflow: "visible", zIndex: 2, minWidth: 150 }}>
          {key === "Category" ? (
            isEditing ? (
              <select
                value={editableRow[key]}
                onChange={(e) => {
                  handleChange(key, e.target.value);
                  applyBaseline(e.target.value);
                }}
              >
                <option value="">Select Baseline</option>
                {baselines.map((baseline) => (
                  <option key={baseline.id} value={baseline.id}>{baseline.name}</option>
                ))}
              </select>
            ) : (
              <span>{baselines.find((b) => b.id === row[key])?.name || "—"}</span>
            )
          ) : isEditing && dropdownStructureMap[key] ? (
            <>
              <div
                onClick={() => setOpenDropdownKey(key)} style={{
                cursor: "pointer",
                background: "#fff",
                padding: "4px 8px",
                border: "1px solid #ccc",
                borderRadius: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "14px",
                transition: "background 0.2s ease"
              }}
              >
                {editableRow[key] || "Select..."} <span style={{ marginLeft: "auto", fontSize: "10px" }}>▼</span>
              </div>
              <NestedDropdown
                visible={openDropdownKey === key}
                structure={dropdownStructureMap[key]}
                onSelect={(val) => {
                  handleChange(key, val);
                  setOpenDropdownKey(null);
                }}
                onRequestClose={() => setOpenDropdownKey(null)}
                onAddItem={(newItem) => dropdownStructureMap[key].push(newItem)}
                onAddSubItem={(parent, subItem) => {
                  const structure = dropdownStructureMap[key];
                  const parentIndex = structure.findIndex(item => item === parent);
                  if (parentIndex !== -1) {
                    const nextItem = structure[parentIndex + 1];
                    if (Array.isArray(nextItem)) {
                      nextItem.push(subItem);
                    } else {
                      structure.splice(parentIndex + 1, 0, [subItem]);
                    }
                  }
                }}
              />
            </>
          ) : isEditing ? (
            <input
              type="text"
              value={editableRow[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className={invalidFields.includes(key) ? "error-cell" : ""}
              style={{ width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}
            />
          ) : (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{row[key] || "—"}</span>
          )}
        </div>
      ))}

      <div className="cell">
        {isEditing ? (
          <>
            <button onClick={() => {
              if (validateFields()) {
                onSave(editableRow);
                setIsEditing(false);
                setInvalidFields([]);
              } else {
                alert("Please fix the highlighted fields before saving.");
              }
            }}>
              ✔ Save
            </button>
            <button onClick={handleCancel}>✖ Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)}>✏</button>
            <button onClick={() => onDelete(row.id)}>🗑</button>
            <button onClick={() => {
              console.log("📁 clicked for propertyId", row.id);
              onOpenFiles(row.id);
            }}>
              📁
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Row;
