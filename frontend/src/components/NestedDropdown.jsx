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

  const cleanNumber = (value) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    return cleaned === "" ? 0 : parseFloat(cleaned);
  };

  const toggleExpand = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const calculateSubTotal = (parent, subItems) => {
    return subItems.reduce((sum, sub) => {
      const raw = data.details?.[parent]?.[sub] || "";
      const val = cleanNumber(raw);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const handleSubItemChange = (group, sub, value) => {
    const structureIndex = structure.findIndex(i => i === group);
    const subItems = Array.isArray(structure[structureIndex + 1]) ? structure[structureIndex + 1] : [];

    const newSub = {
      ...(data.details?.[group] || {}),
      [sub]: value
    };

    const newTotal = subItems.reduce((sum, key) => {
      const raw = key === sub ? value : data.details?.[group]?.[key];
      const num = cleanNumber(raw ?? "");
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const updated = {
      ...data,
      details: {
        ...data.details,
        [group]: {
          ...newSub,
          __value: newTotal
        },
      },
    };

    onDataUpdate(updated);
  };

  const handleValueChange = (label, value) => {
    const parsed = cleanNumber(value);

    const updated = {
      ...data,
      details: {
        ...data.details,
        [label]: {
          ...(data.details?.[label] || {}),
          __value: parsed,
          display: value
        },
      },
    };

    onDataUpdate(updated);
  };

  const calculateParentTotal = () => {
    return structure.reduce((sum, item) => {
      if (typeof item === "string") {
        const val = parseFloat(data.details?.[item]?.__value);
        return sum + (isNaN(val) ? 0 : val);
      }
      return sum;
    }, 0);
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    structure.push(newItem.trim());
    structure.push([]);
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

  if (!data || !data.details) {
    console.warn("❌ NestedDropdown received invalid data:", data);
    return <div style={{ color: "red" }}>Dropdown data missing</div>;
  }

  const renderStructure = () => {
    return structure.map((item, idx) => {
      if (typeof item === "string") {
        const hasSubitems = Array.isArray(structure[idx + 1]);
        const subItems = hasSubitems ? structure[idx + 1] : [];
        const parentValueRaw = data.details?.[item]?.display ?? "";
        const parentValue = cleanNumber(parentValueRaw);
        const subTotal = hasSubitems ? calculateSubTotal(item, subItems) : 0;

        return (
          <div key={item} className="dropdown-section">
            <div className="dropdown-header" onClick={() => toggleExpand(item)}>
              ▶ {item} ({isNaN(parentValue) ? 0 : parentValue}%)
            </div>
            <div className="dropdown-input-wrapper" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                inputMode="decimal"
                placeholder="%"
                value={parentValueRaw}
                onChange={(e) => handleValueChange(item, e.target.value)}
                disabled={hasSubitems}
              />
            </div>
            {expanded[item] && (
              <div className="dropdown-sublist">
                {subItems.map((sub, subIdx) => (
                  <div key={subIdx} className="dropdown-subitem">
                    <label>{sub}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="%"
                      value={data.details?.[item]?.[sub] ?? ""}
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
                    Subtotal: {subTotal}% / {isNaN(parentValue) ? 0 : parentValue}%
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