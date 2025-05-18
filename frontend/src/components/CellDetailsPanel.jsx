import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import FileExplorer from "./Sidebar/FileSystem/FileExplorer";
import "../styles/CellDetailsPanel.css";

const CellDetailsPanel = ({
  columnKey,
  data,
  onUpdate,
  propertyId,
  userId,
  onClose,
}) => {
  const [localData, setLocalData] = useState(data);
  const [newSubInputs, setNewSubInputs] = useState({});
  const [folders, setFolders] = useState([]);
  const [showFileSidebar, setShowFileSidebar] = useState(false);

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

  const handleSubInputChange = (parentKey, subKey, value) => {
    const updated = {
      ...localData,
      details: {
        ...localData.details,
        [parentKey]: {
          ...localData.details[parentKey],
          [subKey]: value,
        },
      },
    };
    setLocalData(updated);
  };

  const handleDeleteSubInput = (parentKey, subKey) => {
    const updatedGroup = { ...localData.details[parentKey] };
    delete updatedGroup[subKey];

    const updated = {
      ...localData,
      details: {
        ...localData.details,
        [parentKey]: updatedGroup,
      },
    };
    setLocalData(updated);
  };

  const handleParentValueChange = (parentKey, value) => {
    const updated = {
      ...localData,
      details: {
        ...localData.details,
        [parentKey]: {
          ...(localData.details[parentKey] || {}),
          __value: parseFloat(value),
        },
      },
    };
    setLocalData(updated);
  };

  const handleAddSubInput = (parentKey) => {
    const label = newSubInputs[parentKey]?.trim();
    if (!label) return;

    const updated = {
      ...localData,
      details: {
        ...localData.details,
        [parentKey]: {
          ...localData.details[parentKey],
          [label]: 0,
        },
      },
    };
    setLocalData(updated);
    setNewSubInputs((prev) => ({ ...prev, [parentKey]: "" }));
  };

  const calculateSubTotal = (parentKey) => {
    const subItems = Object.entries(localData.details[parentKey] || {}).filter(
      ([k]) => !["__value", "display"].includes(k)
    );
    return subItems.reduce((sum, [_, val]) => sum + parseFloat(val || 0), 0);
  };

  const handleSave = () => {
    onUpdate(localData);
  };

  return (
    <div className="cell-details-panel">
      <div className="panel-header">
        <h3>📊 {columnKey} Breakdown</h3>
        <button
          className="open-folder-btn"
          onClick={() => setShowFileSidebar(!showFileSidebar)}
        >
          📂 Toggle Folder View
        </button>
      </div>

      {showFileSidebar && (
        <div className="file-sidebar">
          <FileExplorer
            propertyId={propertyId}
            folderPath={[columnKey]}
            defaultPath={[columnKey]}
          />
        </div>
      )}

      <div className="modal-section">
        {Object.entries(localData.details || {}).map(
          ([parentKey, parentValue]) => (
            <div key={parentKey} className="parent-group">
              <div className="parent-row">
                <label className="parent-label">
                  <strong>{parentKey}</strong>
                </label>
                <input
                  type="number"
                  className={`parent-input ${
                    calculateSubTotal(parentKey) ===
                    parseFloat(parentValue.__value || 0)
                      ? "valid"
                      : "invalid"
                  }`}
                  value={parentValue.__value || 0}
                  onChange={(e) =>
                    handleParentValueChange(parentKey, e.target.value)
                  }
                />
                <div className="subtotal-summary">
                  Subtotal: {calculateSubTotal(parentKey)} /{" "}
                  {parentValue.__value || 0}
                </div>
              </div>

              <div className="subinput-list">
                {Object.entries(parentValue).map(([subKey, subVal]) => {
                  if (["__value", "display"].includes(subKey)) return null;
                  return (
                    <div key={subKey} className="subinput-item">
                      <label>{subKey}</label>
                      <input
                        type="number"
                        value={subVal}
                        onChange={(e) =>
                          handleSubInputChange(
                            parentKey,
                            subKey,
                            e.target.value
                          )
                        }
                      />
                      <button
                        onClick={() => handleDeleteSubInput(parentKey, subKey)}
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="add-subinput">
                <input
                  type="text"
                  placeholder="New subinput name"
                  value={newSubInputs[parentKey] || ""}
                  onChange={(e) =>
                    setNewSubInputs((prev) => ({
                      ...prev,
                      [parentKey]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => handleAddSubInput(parentKey)}>
                  + Add Subinput
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <div className="panel-footer">
        <button className="btn-save" onClick={handleSave}>
          ✅ Save
        </button>
        <button className="btn-cancel" onClick={onClose}>
          ❌ Cancel
        </button>
      </div>
    </div>
  );
};

export default CellDetailsPanel;
