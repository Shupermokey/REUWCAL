import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../app/AuthProvider";
import "../styles/NestedDropdown.css";
import { addFolder, fetchMatchingFolderTree } from "../services/firestoreService";

const NestedDropdown = ({
  structure,
  data,
  onDataUpdate,
  visible,
  onRequestClose,
  columnKey,
  propertyId,
}) => {
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const [expanded, setExpanded] = useState({});
  const [folderTree, setFolderTree] = useState([]);
  const [newSubInputs, setNewSubInputs] = useState({});
  const [subinputsVisible, setSubinputsVisible] = useState({});
  const [editingKeys, setEditingKeys] = useState({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onRequestClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onRequestClose]);

  useEffect(() => {
    if (!user || !propertyId || !columnKey) return;
    const loadMatchingFolder = async () => {
      const filtered = await fetchMatchingFolderTree(user.uid, propertyId, columnKey);
      setFolderTree(filtered);
    };
    loadMatchingFolder();
  }, [user, propertyId, columnKey]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddFolder = async (parentPath = []) => {
    const folderName = prompt("Enter folder name:");
    if (!folderName || !user || !propertyId) return;
    await addFolder(parentPath, folderName);
    const updated = await fetchMatchingFolderTree(user.uid, propertyId, columnKey);
    setFolderTree(updated);
  };

  const handleDrop = (e, folder) => {
    const label = e.dataTransfer.getData("text/plain");
    console.log(`📦 Moved "${label}" to folder "${folder.title}"`);
  };

  const renderFolderTree = (folder) => (
    <div key={folder.id} className="dropdown-folder">
      <div className="dropdown-folder-title" onClick={() => toggleExpand(folder.id)}>
        {expanded[folder.id] ? "📂" : "📁"} {folder.title}
      </div>
      {expanded[folder.id] && (
        <div className="dropdown-subfolder-list">
          {folder.children.map((child) => renderFolderTree(child))}
          <button onClick={() => handleAddFolder(folder.path.concat("folders"))}>+ Subfolder</button>
          <div
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, folder)}
          >
            Drop items here
          </div>
        </div>
      )}
    </div>
  );

  const calculateSubTotal = (parentKey) => {
    const subItems = Object.entries(data.details[parentKey] || {}).filter(
      ([k]) => !["__value", "display"].includes(k)
    );
    return subItems.reduce((sum, [_, val]) => sum + parseFloat(val || 0), 0);
  };

  const handleAddSubItem = (parentKey) => {
    const subName = newSubInputs[parentKey]?.trim();
    if (!subName) return;

    const updated = {
      ...data,
      details: {
        ...data.details,
        [parentKey]: {
          ...data.details[parentKey],
          [subName]: "0",
        },
      },
    };
    setNewSubInputs((prev) => ({ ...prev, [parentKey]: "" }));
    onDataUpdate(updated);
  };

  const handleDelete = (parentKey, subKey = null) => {
    const newDetails = { ...data.details };
    if (subKey) {
      delete newDetails[parentKey][subKey];
    } else {
      delete newDetails[parentKey];
    }
    onDataUpdate({ ...data, details: newDetails });
  };

  const handleEditToggle = (key, subKey = null) => {
    const keyPath = subKey ? `${key}::${subKey}` : key;
    setEditingKeys((prev) => ({ ...prev, [keyPath]: !prev[keyPath] }));
  };

  const getInputBorderColor = (parentKey) => {
    const subtotal = calculateSubTotal(parentKey);
    const expected = parseFloat(data.details[parentKey]?.__value || 0);
    return subtotal === expected ? "2px solid green" : "2px solid red";
  };

  if (!visible) return null;

  return (
    <div className="nested-dropdown-wrapper">
      <div ref={dropdownRef} className="nested-dropdown">
        <div className="dropdown-title">Cell Details</div>

        <div className="dropdown-folder-tree">
          {folderTree.map((folder) => renderFolderTree(folder))}
          <button
            onClick={() =>
              handleAddFolder([
                "users",
                user.uid,
                "properties",
                propertyId,
                "fileSystem",
              ])
            }
          >
            ➕ Add Folder
          </button>
        </div>

        <div className="dropdown-inputs">
          {Object.entries(data.details || {}).map(([key, value]) => {
            if (key.startsWith("__") || typeof value !== "object") return null;
            const parentValue = parseFloat(value.__value || 0);
            const showSubs = subinputsVisible[key];

            return (
              <div key={key} className="dropdown-input-row" style={{ marginTop: 12 }}>
                <label
                  style={{ fontWeight: "bold", cursor: "pointer" }}
                  onClick={() =>
                    setSubinputsVisible((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                >
                  {showSubs ? "▼" : "▶"} {key}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={value.display || ""}
                  onChange={(e) => {
                    const updated = {
                      ...data,
                      details: {
                        ...data.details,
                        [key]: {
                          ...data.details[key],
                          display: e.target.value,
                          __value: parseFloat(e.target.value || "0"),
                        },
                      },
                    };
                    onDataUpdate(updated);
                  }}
                  style={{ border: getInputBorderColor(key) }}
                />
                <button onClick={() => handleDelete(key)}>🗑</button>

                {showSubs &&
                  Object.entries(value).map(([subKey, subValue]) => {
                    if (["__value", "display"].includes(subKey)) return null;
                    const editKey = `${key}::${subKey}`;
                    const isEditing = editingKeys[editKey];

                    return (
                      <div key={subKey} style={{ marginLeft: 16 }}>
                        <label>{subKey}</label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={subValue}
                            onChange={(e) => {
                              const updated = {
                                ...data,
                                details: {
                                  ...data.details,
                                  [key]: {
                                    ...data.details[key],
                                    [subKey]: e.target.value,
                                  },
                                },
                              };
                              onDataUpdate(updated);
                            }}
                            style={{
                              border:
                                calculateSubTotal(key) === parseFloat(value.__value || 0) 
                                  ? "2px solid green"
                                  : "2px solid red",
                            }}
                          />
                        ) : (
                          <span style={{ marginLeft: 8 }}>{subValue}</span>
                        )}
                        <button onClick={() => handleEditToggle(key, subKey)}>
                          {isEditing ? "✔" : "✏"}
                        </button>
                        <button onClick={() => handleDelete(key, subKey)}>🗑</button>
                      </div>
                    );
                  })}

                {showSubs && (
                  <div style={{ marginTop: 6 }}>
                    <input
                      type="text"
                      placeholder="New subinput"
                      value={newSubInputs[key] || ""}
                      onChange={(e) =>
                        setNewSubInputs((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                    <button onClick={() => handleAddSubItem(key)}>Add Sub</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NestedDropdown;
