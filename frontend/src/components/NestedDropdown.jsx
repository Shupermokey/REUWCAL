// NestedDropdown.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles//NestedDropdown.css";

const NestedDropdown = ({
  structure,
  onSelect,
  onAddItem,
  onAddSubItem,
  visible,
  onRequestClose
}) => {
  const [expanded, setExpanded] = useState({});
  const [newItem, setNewItem] = useState("");
  const [newSubItem, setNewSubItem] = useState({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onRequestClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onRequestClose]);

  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddItem(newItem.trim());
      setNewItem("");
    }
  };

  const handleAddSubItem = (parent) => {
    if (newSubItem[parent]?.trim()) {
      onAddSubItem(parent, newSubItem[parent].trim());
      setNewSubItem((prev) => ({ ...prev, [parent]: "" }));
    }
  };

  const renderStructure = () => {
    const lines = [];

    for (let i = 0; i < structure.length; i++) {
      const item = structure[i];
      const next = structure[i + 1];

      if (Array.isArray(item)) continue;

      lines.push(
        <div key={`main-${i}`} className="dropdown-line" onClick={() => onSelect(item)}>
          - {item}
        </div>
      );

      if (Array.isArray(next)) {
        next.forEach((sub, j) => {
          lines.push(
            <div
              key={`sub-${i}-${j}`}
              className="dropdown-subitem"
              onClick={() => onSelect(sub)}
            >
              - - {sub}
            </div>
          );
        });

        lines.push(
          <div key={`sub-add-${i}`} className="dropdown-subadd">
            <input
              type="text"
              placeholder="Add subitem"
              value={newSubItem[item] || ""}
              onChange={(e) =>
                setNewSubItem((prev) => ({ ...prev, [item]: e.target.value }))
              }
            />
            <button onClick={() => handleAddSubItem(item)}>Add</button>
          </div>
        );
      }
    }

    return lines;
  };

  if (!visible) return null;

  return (
    <div ref={dropdownRef} className="nested-dropdown excel-style">
      <div className="dropdown-title">Purchase Price Dropdown</div>
      <div className="dropdown-content">
        {renderStructure()}
      </div>
      <div className="dropdown-add">
        <input
          type="text"
          placeholder="Add item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button onClick={handleAddItem}>Add</button>
      </div>
    </div>
  );
};

export default NestedDropdown;
