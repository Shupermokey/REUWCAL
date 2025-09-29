import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "../styles/CellDetailsPanel.css";

const levelColors = [
  "#f5f5f5", // light gray
  "#e0f7fa", // light cyan
  "#fff3e0", // light orange
  "#e8f5e9", // light green
  "#ede7f6", // light lavender
  "#fce4ec", // light pink
  "#f3e5f5", // soft purple
  "#e1f5fe", // baby blue
  "#f9fbe7", // pale yellow-green
];

export const getNodeTotal = (node) => {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + getNodeTotal(child), 0);
  }
  return parseFloat(node.value || 0);
};

const RecursiveInput = ({
  node,
  onChange,
  onAdd,
  onDelete,
  level = 0,
  index,
  moveNode,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const backgroundColor = levelColors[level % levelColors.length];

  const handleLabelChange = (newLabel) => {
    const updatedNode = {
      ...node,
      label: newLabel,
    };
    onChange(updatedNode);
  };

  const handleValueChange = (newValue) => {
    const updatedNode = {
      ...node,
      value: parseFloat(newValue || 0),
    };
    onChange(updatedNode);
  };

  const handleChildChange = (childIndex, updatedChild) => {
    const updatedChildren = [...(node.children || [])];
    updatedChildren[childIndex] = updatedChild;
    const updatedNode = {
      ...node,
      children: updatedChildren,
      value: getNodeTotal({ ...node, children: updatedChildren }),
    };
    onChange(updatedNode);
  };

  const handleAddChild = () => {
    const updatedChildren = [
      ...(node.children || []),
      { value: 0, label: "", children: [] },
    ];
    const updatedNode = {
      ...node,
      children: updatedChildren,
    };
    onChange(updatedNode);
  };

  const handleDeleteChild = (childIndex) => {
    const updatedChildren = [...(node.children || [])];
    updatedChildren.splice(childIndex, 1);
    const updatedNode = {
      ...node,
      children: updatedChildren,
    };
    onChange(updatedNode);
  };

  const [{ isDragging }, dragRef] = useDrag({
    type: "NODE",
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: "NODE",
    drop: (draggedItem) => {
      if (moveNode && draggedItem.index !== index) {
        moveNode(draggedItem.index, index);
      }
    },
  });

  return (
    <div
      ref={(el) => (moveNode ? dragRef(dropRef(el)) : el)}
      className={`nested-input level-${level}`}
      style={{
        marginLeft: level * 16,
        borderLeft: "2px solid #ddd",
        paddingLeft: 8,
        marginTop: 8,
        backgroundColor,
        padding: 8,
        borderRadius: 4,
        cursor: moveNode ? "move" : "default",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="nested-input-row">
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ marginRight: 4 }}
        >
          {collapsed ? "▶" : "▼"}
        </button>
        <span style={{ cursor: "grab", marginRight: 4 }}>☰</span>
        <input
          type="text"
          placeholder="Label"
          value={node.label || ""}
          onChange={(e) => handleLabelChange(e.target.value)}
          style={{ marginRight: 8 }}
        />
        
        {node.children && node.children.length > 0 ? (
          <input type="number" value={getNodeTotal(node).toFixed(2)} disabled />
        ) : (
          <input
            type="number"
            value={node.value || 0}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        )}

        <button onClick={handleAddChild}>➕ Sub</button>
        <button onClick={onDelete}>🗑</button>
        <span style={{ marginLeft: "auto", fontWeight: "bold" }}>
          Total: {getNodeTotal(node).toFixed(2)}
        </span>
      </div>
      {!collapsed && (
        <div className="nested-children">
          {(node.children || []).map((child, i) => (
            <RecursiveInput
              key={i}
              node={child}
              index={i}
              level={level + 1}
              moveNode={(from, to) => {
                const newChildren = [...(node.children || [])];
                const [moved] = newChildren.splice(from, 1);
                newChildren.splice(to, 0, moved);
                onChange({ ...node, children: newChildren });
              }}
              onChange={(val) => handleChildChange(i, val)}
              onAdd={handleAddChild}
              onDelete={() => handleDeleteChild(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CustomBreakdownInputs = ({ data, setData, columnKey }) => {
  const customInputs = (data.customInputsByColumn || {})[columnKey] || [];

  const computeTotal = (nodes) =>
    nodes.reduce((sum, node) => sum + getNodeTotal(node), 0);

  const setUpdatedInputs = (updated) => {
    const total = computeTotal(updated);
    setData((prev) => {
      const updatedData = {
        ...prev,
        customInputsByColumn: {
          ...(prev.customInputsByColumn || {}),
          [columnKey]: updated,
        },
        value: total,
      };
      return updatedData;
    });
  };

  const handleAddInput = () => {
    setUpdatedInputs([...customInputs, { value: 0, label: "", children: [] }]);
  };

  const handleDeleteInput = (index) => {
    const updated = [...customInputs];
    updated.splice(index, 1);
    setUpdatedInputs(updated);
  };

  const updateInputAtIndex = (index, updatedNode) => {
    const updated = [...customInputs];
    updated[index] = updatedNode;
    setUpdatedInputs(updated);
  };

  const moveNode = (from, to) => {
    const updated = [...customInputs];
    const [movedItem] = updated.splice(from, 1);
    updated.splice(to, 0, movedItem);
    setUpdatedInputs(updated);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="custom-input-group">
        {customInputs.map((item, index) => (
          <RecursiveInput
            key={index}
            node={item}
            index={index}
            level={0}
            moveNode={moveNode}
            onChange={(newNode) => updateInputAtIndex(index, newNode)}
            onAdd={() => {
              const updatedNode = {
                ...item,
                children: [
                  ...(item.children || []),
                  { value: 0, label: "", children: [] },
                ],
              };
              updateInputAtIndex(index, updatedNode);
            }}
            onDelete={() => handleDeleteInput(index)}
          />
        ))}
        <div className="add-custom-row">
          <button onClick={handleAddInput}>➕ Add Line Item</button>
          <div className="custom-total">
            Grand Total: {computeTotal(customInputs).toFixed(2)}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default CustomBreakdownInputs;
