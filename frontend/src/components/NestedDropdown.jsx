// NestedDropdown.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/NestedDropdown.css";

const NestedDropdown = ({ structure, data, onDataUpdate, visible, onRequestClose, columnKey }) => {
  const [expanded, setExpanded] = useState({});
  const [newItem, setNewItem] = useState("");
  const [newSubItems, setNewSubItems] = useState({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onRequestClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onRequestClose]);

  const toggleExpand = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const calculateSubTotal = (parent, subItems) => {
    return subItems.reduce((sum, sub) => {
      const val = parseFloat(data.details?.[parent]?.[sub] || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const handleSubItemChange = (group, sub, value) => {
    const parsed = parseFloat(value);
    const structureIndex = structure.findIndex(i => i === group);
    const subItems = Array.isArray(structure[structureIndex + 1]) ? structure[structureIndex + 1] : [];
    const newSub = {
      ...(data.details?.[group] || {}),
      [sub]: value
    };
    const newTotal = subItems.reduce((sum, key) => {
      const val = parseFloat(key === sub ? value : data.details?.[group]?.[key] || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const updated = {
      ...data,
      details: {
        ...data.details,
        [group]: {
          ...newSub,
          __value: newTotal,
        },
      },
    };
    onDataUpdate((prevRow) => ({ ...prevRow, [columnKey]: updated }));
  };

  const handleValueChange = (label, value) => {
    const updated = {
      ...data,
      details: {
        ...data.details,
        [label]: {
          ...(data.details?.[label] || {}),
          __value: value,
        },
      },
    };
    onDataUpdate((prevRow) => ({ ...prevRow, [columnKey]: updated }));
  };

  const calculateParentTotal = () => {
    return structure.reduce((sum, item, idx) => {
      if (typeof item === "string") {
        const value = parseFloat(data.details?.[item]?.__value || 0);
        return sum + (isNaN(value) ? 0 : value);
      }
      return sum;
    }, 0);
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    structure.push(newItem.trim());
    setNewItem("");
  };

  const handleAddSubItem = (parent) => {
    const newSub = newSubItems[parent]?.trim();
    if (!newSub) return;
    const parentIndex = structure.findIndex(i => i === parent);
    if (parentIndex !== -1) {
      const next = structure[parentIndex + 1];
      if (Array.isArray(next)) {
        next.push(newSub);
      } else {
        structure.splice(parentIndex + 1, 0, [newSub]);
      }
    } else {
      structure.push(parent);
      structure.push([newSub]);
    }
    setNewSubItems(prev => ({ ...prev, [parent]: "" }));
  };

  const renderStructure = () => {
    return structure.map((item, idx) => {
      if (typeof item === "string") {
        const hasSubitems = Array.isArray(structure[idx + 1]);
        const subItems = hasSubitems ? structure[idx + 1] : [];
        const parentValue = parseFloat(data.details?.[item]?.__value || 0);
        const subTotal = hasSubitems ? calculateSubTotal(item, subItems) : 0;
        return (
          <div key={item} className="dropdown-section">
            <div className="dropdown-header" onClick={() => toggleExpand(item)}>
              ▶ {item} ({parentValue}%)
            </div>
            <input
              type="number"
              placeholder="%"
              value={parentValue}
              onChange={(e) => handleValueChange(item, e.target.value)}
              disabled={hasSubitems}
            />
            {expanded[item] && (
              <div className="dropdown-sublist">
                {subItems.map((sub, subIdx) => (
                  <div key={subIdx} className="dropdown-subitem">
                    <label>{sub}</label>
                    <input
                      type="number"
                      placeholder="%"
                      value={data.details?.[item]?.[sub] || ""}
                      onChange={(e) => handleSubItemChange(item, sub, e.target.value)}
                    />
                  </div>
                ))}
                <div className="dropdown-subadd">
                  <input
                    type="text"
                    placeholder="New subitem"
                    value={newSubItems[item] || ""}
                    onChange={(e) => setNewSubItems(prev => ({ ...prev, [item]: e.target.value }))}
                  />
                  <button onClick={() => handleAddSubItem(item)}>Add Sub</button>
                </div>
                {hasSubitems && (
                  <div style={{ fontSize: "12px", color: subTotal !== parentValue ? "red" : "green" }}>
                    Subtotal: {subTotal}% / {parentValue}%
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      return null;
    });
  };

  if (!visible) return null;
  const totalTop = calculateParentTotal();

  return (
    <div ref={dropdownRef} className="nested-dropdown">
      <div className="dropdown-title">Cell Details</div>
      {renderStructure()}
      <div className="dropdown-add">
        <input
          type="text"
          placeholder="New item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>
      <div style={{ marginTop: 12, fontWeight: "bold", color: totalTop !== 100 ? "red" : "green" }}>
        Total: {totalTop}% / 100%
      </div>
    </div>
  );
};

export default NestedDropdown;