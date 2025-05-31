import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
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
      .filter(([_, val]) => typeof val === "number")
      .reduce((sum, [_, val]) => sum + parseFloat(val || 0), 0);

    const updated = {
      ...localData,
      value: valueSum,
    };
    onUpdate(updated);
  };

  const addNewCategory = async () => {
    const cleaned = newCategory.trim();
    if (!cleaned || defaultCategories.includes(cleaned)) return;
    const ref = collection(db, "users", userId, "zoningCategories");
    await addDoc(ref, { label: cleaned });
    setCustomCategories((prev) => [...prev, cleaned]);
    setNewCategory("");
  };

  const handleDeleteCategory = async (cat) => {
    if (!userId || defaultCategories.includes(cat)) return;

    // Fetch all docs in the zoningCategories collection
    const ref = collection(db, "users", userId, "zoningCategories");
    const snapshot = await getDocs(ref);

    // Match document by value (case-sensitive match since you stored with original casing)
    const matchingDoc = snapshot.docs.find((doc) => doc.data().label === cat);

    if (matchingDoc) {
      await deleteDoc(matchingDoc.ref);
      setCustomCategories((prev) => prev.filter((c) => c !== cat));

      // Fallback if the deleted category was selected
      if (localData.details?.["Zoning Category"] === cat) {
        handleChange("Zoning Category", "Residential");
      }
    } else {
      console.error("No Firestore doc matched for deletion:", cat);
    }
  };

  const structure = breakdownConfig[columnKey] || [];

  return (
    <div className="cell-details-panel">
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

          if (type === "folder") return null;

          if (type === "radio" && style === "button") {
            return (
              <div className="input-group" key={label}>
                <label>{label}</label>
                <div className="button-radio-group">
                  {[...options, ...customCategories].map((opt) => (
                    <div className="radio-button-wrapper" key={opt}>
                      <button
                        className={`radio-button ${
                          value === opt ? "active" : ""
                        } ${
                          !defaultCategories.includes(opt)
                            ? "delete-capable"
                            : ""
                        }`}
                        onClick={() => handleChange(label, opt)}
                        type="button"
                      >
                        {opt}
                      </button>

                      {!defaultCategories.includes(opt) && (
                        <span
                          className="delete-icon"
                          onClick={() => handleDeleteCategory(opt)}
                          title={`Delete ${opt}`}
                        >
                          ×
                        </span>
                      )}
                    </div>
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

        {/* Folder icons */}
        {structure.some((f) => f.type === "folder") && (
          <div className="folder-grid-group">
            <div className="folder-grid">
              {structure
                .filter((f) => f.type === "folder")
                .map(({ label }) => (
                  <div
                    key={label}
                    className="folder-icon"
                    onClick={() => setShowFileSidebar(true)}
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
