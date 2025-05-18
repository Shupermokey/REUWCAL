import React from "react";
import Modal from "react-modal";
import "../styles/NestedDropdown.css";

Modal.setAppElement("#root");

const NestedDropdownModal = ({
  isOpen,
  onRequestClose,
  structure,
  data,
  columnKey,
  propertyId,
  onDataUpdate,
}) => {
  const [localData, setLocalData] = React.useState(data);
  const [newSubInputs, setNewSubInputs] = React.useState({});

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
    setNewSubInputs(prev => ({ ...prev, [parentKey]: "" }));
  };

  const calculateSubTotal = (parentKey) => {
    const subItems = Object.entries(localData.details[parentKey] || {}).filter(
      ([k]) => !["__value", "display"].includes(k)
    );
    return subItems.reduce((sum, [_, val]) => sum + parseFloat(val || 0), 0);
  };

  const handleSave = () => {
    onDataUpdate(localData);
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={`Edit ${columnKey}`}
      className="dropdown-modal"
      overlayClassName="dropdown-modal-overlay"
    >
      <div className="modal-header">
        <h2>Edit: {columnKey}</h2>
      </div>

      <div className="modal-body">
        <div className="modal-section">
          <h3>📁 Linked Folder</h3>
          <p><code>{columnKey}</code></p>
        </div>

        <div className="modal-section">
          <h3>📊 Value Breakdown</h3>
          {Object.entries(localData.details || {}).map(([parentKey, parentValue]) => (
            <div key={parentKey} className="parent-group">
              <div className="parent-row">
                <label className="parent-label">
                  <strong>{parentKey}</strong>
                </label>
                <input
                  type="number"
                  className="parent-input"
                  value={parentValue.__value || 0}
                  onChange={(e) => handleParentValueChange(parentKey, e.target.value)}
                  style={{
                    border:
                      calculateSubTotal(parentKey) === parseFloat(parentValue.__value || 0)
                        ? "2px solid green"
                        : "2px solid red",
                  }}
                />
                <div className="subtotal-summary">
                  Subtotal: {calculateSubTotal(parentKey)} / {parentValue.__value || 0}
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
                        onChange={(e) => handleSubInputChange(parentKey, subKey, e.target.value)}
                      />
                      <button onClick={() => handleDeleteSubInput(parentKey, subKey)}>🗑</button>
                    </div>
                  );
                })}
              </div>

              <div className="add-subinput">
                <input
                  type="text"
                  placeholder="New subinput name"
                  value={newSubInputs[parentKey] || ""}
                  onChange={(e) => setNewSubInputs(prev => ({ ...prev, [parentKey]: e.target.value }))}
                />
                <button onClick={() => handleAddSubInput(parentKey)}>+ Add Subinput</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-save" onClick={handleSave}>✅ Save</button>
        <button className="btn-cancel" onClick={onRequestClose}>❌ Cancel</button>
      </div>
    </Modal>
  );
};

export default NestedDropdownModal;
