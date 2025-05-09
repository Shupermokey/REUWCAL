import { useEffect, useState } from "react";
import { doc, collection, addDoc, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthProvider";
import { db } from "../../../services/firebaseConfig";

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
  "Category", // keep this last so the dropdown renders at the end
];

function PerformaTable({
  baseRow,
  baselines,
  scenarioRows,
  setScenarioRows,
  baselineMap,
}) {
  const { user } = useAuth();
  const [editingRowId, setEditingRowId] = useState(null);

  const nameToId = (name) => {
    const match = baselines.find(b => b.name === name);
    return match ? match.id : name;
  };


  useEffect(() => {
    const fetchScenarioRows = async () => {
      if (!user || !baseRow?.id) return;
      const snap = await getDocs(
        collection(db, "users", user.uid, "properties", baseRow.id, "scenarioRows")
      );
  
      const firestoreRows = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      const baseScenario = {
        ...baseRow,
        id: "base",
        Category: nameToId(baseRow.Category || ""),
      };
      console.log("📥 Loaded scenarioRows from Firestore:", firestoreRows);

      const cleanRows = firestoreRows.filter(r => r.id !== "base" && r.id !== "new");
  
      setScenarioRows([baseScenario, ...cleanRows]);
    };
  
    fetchScenarioRows();
  }, [user, baseRow?.id, baseRow?.Category, baselines]);
  
  
  
 

  
  const handleScenarioChange = (id, field, value) => {
    setScenarioRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const applyBaseline = (baselineId, rowId) => {
    const baseline = baselines.find((b) => b.id === baselineId);
    if (!baseline || !baseline.rows) return;

    const extractValue = (name) => {
      const row = baseline.rows.find((r) => r.name === name);
      return row?.growthRate || "";
    };

    const updatedFields = {};
    for (const [fieldKey, baselineName] of Object.entries(baselineMap)) {
      updatedFields[fieldKey] = extractValue(baselineName);
    }

    setScenarioRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...updatedFields,
              Category: baselineId, // ✅ Store the ID here
            }
          : row
      )
    );
  };

  const getBaselineName = (id) => {
    if (!id) return "— (no ID)";
    const match = baselines.find((b) => b.id === id);
    return match ? match.name : `— (ID: ${id})`;
  };

  const updateScenarioRow = async (propertyId, scenarioRow) => {
    if (!user || !propertyId || !scenarioRow.id) return;
    try {
      const ref = doc(db, "users", user.uid, "properties", propertyId, "scenarioRows", scenarioRow.id);
      await updateDoc(ref, scenarioRow);
      console.log("✅ Row updated!");
    } catch (err) {
      console.error("❌ Failed to update row:", err.message);
    }
  };
  
  const deleteScenarioRow = async (propertyId, rowId) => {
    if (!user || !propertyId || !rowId) return;
    try {
      const ref = doc(db, "users", user.uid, "properties", propertyId, "scenarioRows", rowId);
      await deleteDoc(ref);
      console.log("🗑 Row deleted");
    } catch (err) {
      console.error("❌ Failed to delete row:", err.message);
    }
  };
  

  const addScenarioRow = () => {
    // Prevent adding another if one is already being edited
    if (scenarioRows.some((row) => row.id === "new")) return;

    const newScenario = {
      ...baseRow,
      id: "new",
      Category: "",
      // Optionally clear other fields:
      purchasePrice: "",
      purchasePriceSF: "",
      ACQCAPX: "",
      ACQCAPXSF: "",
      UnitCount: "",
      GrossBuildingArea: "",
      GrossSiteArea: "",
      REPropertyTax: "",
      MarketRate: "",
      ServiceStructure: "",
      PropertyClass: "",
      // ... etc, based on your setup
    };

    setScenarioRows((prev) => [...prev, newScenario]);
  };

  const saveScenarioRow = async (propertyId, scenarioRow) => {
    if (!user || !propertyId) return;
  
    try {
      const scenarioRef = collection(
        db,
        "users",
        user.uid,
        "properties",
        propertyId,
        "scenarioRows"
      );
  
      // ✅ Remove 'id' before saving to Firestore
      const { id, ...dataToSave } = scenarioRow;
  
      const docRef = await addDoc(scenarioRef, dataToSave);
      console.log("✅ Scenario row saved to:", docRef.id);
  
      // ✅ Reload scenarioRows from Firestore
      const snap = await getDocs(scenarioRef);
      const firestoreRows = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      const baseScenario = {
        ...baseRow,
        id: "base",
        Category: nameToId(baseRow.Category || ""),
      };
  
      const cleanRows = firestoreRows.filter(r => r.id !== "base" && r.id !== "new");
  
      setScenarioRows([baseScenario, ...cleanRows]);
    } catch (error) {
      console.error("❌ Failed to save scenario row:", error.message);
    }
  };
  
  

  return (
    <div style={{ borderTop: "2px solid red", marginTop: "2rem" }}>
      <h3 style={{ color: "red" }}>Proforma Table (Scenario Rows)</h3>
      <button
        onClick={addScenarioRow}
        style={{ backgroundColor: "red", color: "white" }}
      >
        + Add Scenario Row
      </button>
      <div className="proforma-table">
        {scenarioRows.map((row) => {
          const isHeader = row.id === "base";
          const isNew = row.id === "new";
          const isEditing = row.id === editingRowId || isNew;

          return (
            <div
              key={row.id}
              className="scenario-row"
              style={{ display: "flex", marginTop: "1rem" }}
            >
              {columnOrder.map((key) => (
                <div key={key} className="cell" style={{ marginRight: "4px" }}>
                  {key === "Category" ? (
                    isHeader ? (
                      <div style={{ padding: "6px", fontWeight: "bold" }}>
                        {getBaselineName(row[key])}
                      </div>
                    ) : isEditing ? (
                      <select
                        value={row[key] || ""}
                        onChange={(e) => {
                          handleScenarioChange(row.id, key, e.target.value);
                          applyBaseline(e.target.value, row.id);
                        }}
                      >
                        <option value="">Select Baseline</option>
                        {baselines.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>{getBaselineName(row[key])}</div>
                    )
                  ) : (
                    <input
                      type="text"
                      value={row[key] || ""}
                      onChange={(e) =>
                        handleScenarioChange(row.id, key, e.target.value)
                      }
                      readOnly={isHeader || !isEditing}
                      style={{
                        fontWeight: isHeader ? "bold" : "normal",
                        backgroundColor: isHeader
                          ? "#f0f0f0"
                          : isEditing
                          ? "#ffffff"
                          : "#e9e9e9",
                      }}
                    />
                  )}
                </div>
              ))}

{!isHeader && (
  <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
    {isEditing ? (
      <>
        <button
          onClick={() => {
            if (isNew) {
              saveScenarioRow(baseRow.id, row);
            } else {
              updateScenarioRow(baseRow.id, row);
            }
            setEditingRowId(null);
          }}
          style={{ backgroundColor: "green", color: "white" }}
        >
          ✓ Save
        </button>
        <button
          onClick={() => {
            if (isNew) {
              setScenarioRows(prev => prev.filter(r => r.id !== "new"));
            } else {
              setEditingRowId(null); // cancel edit
            }
          }}
        >
          ✖ Cancel
        </button>
      </>
    ) : (
      <>
        <button onClick={() => setEditingRowId(row.id)}>✏ Edit</button>
        <button
          onClick={async () => {
            await deleteScenarioRow(baseRow.id, row.id);
            setScenarioRows(prev => prev.filter(r => r.id !== row.id));
          }}
        >
          🗑 Delete
        </button>
      </>
    )}
  </div>
)}

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PerformaTable;
