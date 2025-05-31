import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { addDoc, collection, getDocs } from "firebase/firestore";
import FileExplorer from "./Sidebar/FileSystem/FileExplorer";
import "../styles/CellDetailsPanel.css";
import CustomBreakdownInputs from "./CustomBreakdownInputs";
import { breakdownConfig } from "../columnConfig";

const CellDetailsPanel = ({
  columnKey,
  data,
  onUpdate,
  propertyId,
  userId,
}) => {
  const [localData, setLocalData] = useState(data);
  const [folders, setFolders] = useState([]);
  const [showFileSidebar, setShowFileSidebar] = useState(false);

  const [customCategories, setCustomCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const defaultCategories = ["Commercial", "Residential"];

  useEffect(() => {
    const loadCustomCategories = async () => {
      if (!userId) return;
      const snap = await getDocs(
        collection(db, "users", userId, "zoningCategories")
      );
      setCustomCategories(snap.docs.map((doc) => doc.data().label));
    };
    loadCustomCategories();
  }, [userId]);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!userId || !propertyId || !columnKey) return;
      const folderRef = collection(
        db,
        "users",
        userId,
        "properties",
        propertyId,
        "fileSystem",
        columnKey,
        "folders"
      );
      const snapshot = await getDocs(folderRef);
      const folderList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFolders(folderList);
    };
    fetchFolders();
  }, [userId, propertyId, columnKey]);

  const handleChange = (label, value) => {
    setLocalData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [label]: value,
      },
    }));
  };

  const handleSave = () => {
    const valueSum = Object.entries(localData.details || {})
      .filter(([key, val]) => typeof val === "number")
      .reduce((sum, [_, val]) => sum + parseFloat(val || 0), 0);

    const updated = {
      ...localData,
      value: valueSum,
    };
    onUpdate(updated);
  };

  const addNewCategory = async () => {
    if (!newCategory.trim()) return;
    const ref = collection(db, "users", userId, "zoningCategories");
    await addDoc(ref, { label: newCategory.trim() });
    setCustomCategories((prev) => [...prev, newCategory.trim()]);
    setNewCategory("");
  };

  const handleDeleteCategory = async (cat) => {
    if (!user || defaultCategories.includes(cat)) return;

    const q = query(
      collection(db, "users", user.uid, "zoningCategories"),
      where("name", "==", cat)
    );
    const snapshot = await getDocs(q);
    const match = snapshot.docs[0];
    if (match) {
      await deleteDoc(match.ref);
      setZoningCategories((prev) => prev.filter((c) => c !== cat));
      if (selected === cat) setSelected("Residential"); // fallback
    }
  };

  const structure = breakdownConfig[columnKey] || [];

  return (
    <div className="cell-details-panel">
      {/* <div className="custom-breakdown-section">
        <h4>📐 Custom Value Breakdown</h4>
        <CustomBreakdownInputs
          data={localData}
          setData={setLocalData}
          columnKey={columnKey}
        />
      </div> */}

      {/* <div className="panel-header">
        <h3>📊 {columnKey} Breakdown</h3>
        <button
          className="open-folder-btn"
          onClick={() => setShowFileSidebar(!showFileSidebar)}
        >
          📂 Toggle Folder View
        </button>
      </div> */}

      {/* {showFileSidebar && (
        <div className="file-sidebar">
          <FileExplorer
            propertyId={propertyId}
            folderPath={[columnKey]}
            defaultPath={[columnKey]}
          />
        </div>
      )} */}

      <div className="modal-section">
        {structure.map((field) => {
          const {
            label,
            type,
            options,
            style,
            dependsOn,
            map,
            default: defaultVal,
          } = field;
          const value = localData.details?.[label] || "";

          if (type === "folder") return null; // ✅ skip folders in main loop

          if (type === "radio" && style === "button") {
            return (
              <div className="input-group">
                <label>Zoning Category</label>
                <div className="button-radio-group">
                  {[...options, ...customCategories].map((opt) => (
                    <button
                      key={opt}
                      className={
                        value === opt ? "radio-button active" : "radio-button"
                      }
                      onClick={() => handleChange("Zoning Category", opt)}
                      type="button"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div
                  style={{ marginTop: "0.5rem", display: "flex", gap: "6px" }}
                >
                  <input
                    type="text"
                    placeholder="Add category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-save" onClick={addNewCategory}>
                    ➕
                  </button>
                </div>
                
              </div>
            );
          }

          if (type === "dynamic-select") {
            const parentVal = localData.details?.[dependsOn] || defaultVal;
            const dynamicOptions = map?.[parentVal] || [];

            if (!parentVal) return null;

            return (
              <div key={label} className="input-group">
                <label>{label}</label>
                <select
                  value={value}
                  onChange={(e) => handleChange(label, e.target.value)}
                >
                  <option value="">Select</option>
                  {dynamicOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {value && !dynamicOptions.includes(value) && (
                    <option value={value}>{value} (Custom)</option>
                  )}
                </select>
              </div>
            );
          }

          if (type === "select") {
            return (
              <div key={label} className="input-group">
                <label>{label}</label>
                <select
                  value={value}
                  onChange={(e) => handleChange(label, e.target.value)}
                >
                  <option value="">Select</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {value && !options.includes(value) && (
                    <option value={value}>{value} (Custom)</option>
                  )}
                </select>
              </div>
            );
          }

          return (
            <div key={label} className="input-group">
              <label>{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => handleChange(label, e.target.value)}
              />
            </div>
          );
        })}

        {/* ✅ Folder grid rendered once here */}
        {structure.some((f) => f.type === "folder") && (
          <div className="folder-grid-group">
            <div className="folder-grid">
              {structure
                .filter((f) => f.type === "folder")
                .map(({ label }) => (
                  <div
                    key={label}
                    className="folder-icon"
                    onClick={() => {
                      setShowFileSidebar(true);
                      // Optional: could store activeFolder if you want per-folder behavior
                    }}
                  >
                    <div className="icon">📁</div>
                    <div className="label">{label}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button className="btn-save" onClick={handleSave}>
          ✅ Save
        </button>
      </div>
    </div>
  );
};

export default CellDetailsPanel;
