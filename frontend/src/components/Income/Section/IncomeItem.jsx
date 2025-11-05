import React, { useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getItemConfig, isDeductionItem } from "@/utils/income/incomeConfig";
import { useIncomeView } from "@/app/providers/IncomeViewProvider";
import { calculateValues, sumChildrenValues } from "@/utils/income/incomeCalculations";
import "@/styles/components/Income/IncomeItem.css";

/**
 * IncomeItem - Recursive component for rendering income statement rows
 * Uses the Section's grid system (sec__rowGrid, sec__subRowGrid)
 */
export default function IncomeItem({
  item,
  depth = 0,
  onUpdate,
  onAddChild,
  onClone,
  onDelete,
  sectionKey,
  order = [],
  grossBuildingAreaSqFt = 0,
  units = 0,
  path = [], // Path to this item in the tree (array of parent IDs)
}) {
  const { displayMode } = useIncomeView();
  const [collapsed, setCollapsed] = useState(false);

  const config = getItemConfig(item.id);
  const hasChildren = item.childOrder && item.childOrder.length > 0;

  // Check if this item should have forced negative values (deductions)
  // For nested items, check the root parent
  const rootId = path.length > 0 ? path[0] : item.id;
  const forceNegative = isDeductionItem(sectionKey, rootId, order);

  // Drag & drop - only enable for non-pinned items at depth 0
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: config.pinned || depth > 0, // Disable dragging for pinned items and nested items
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // If item has children, display values should be the sum of all children
  // Otherwise, use the item's own values
  const displayValues = useMemo(() => {
    if (hasChildren) {
      return sumChildrenValues(item);
    }
    return {
      grossMonthly: item.grossMonthly || 0,
      grossAnnual: item.grossAnnual || 0,
      rateMonthly: item.rateMonthly || 0,
      rateAnnual: item.rateAnnual || 0,
      psfMonthly: item.psfMonthly || 0,
      psfAnnual: item.psfAnnual || 0,
      punitMonthly: item.punitMonthly || 0,
      punitAnnual: item.punitAnnual || 0,
    };
  }, [item, hasChildren]);

  // Determine which columns to show
  const showMonthly = displayMode === "monthly" || displayMode === "both";
  const showAnnual = displayMode === "annual" || displayMode === "both";

  // Handle input changes with auto-calculations
  const handleChange = (field, value) => {
    const numValue = parseFloat(value) || 0;

    // Calculate all derived values
    const calculatedUpdates = calculateValues(
      field,
      numValue,
      item,
      grossBuildingAreaSqFt,
      units,
      forceNegative
    );

    // Update with all calculated values
    onUpdate(item.id, calculatedUpdates);
  };

  // Format number for display
  const formatValue = (val) => {
    if (!val || val === 0) return "";
    return val.toString();
  };

  // Inputs should be readonly if item has children OR if config says calculated
  const isReadOnly = hasChildren || config.calculated;

  // Use appropriate grid class based on depth
  const gridClass = depth === 0 ? "sec__rowGrid" : "sec__subRowGrid";

  return (
    <>
      {/* Main row using Section's grid system */}
      <div className={gridClass} ref={setNodeRef} style={style}>
        {/* First cell: drag handle + collapse button */}
        <div className="sec__firstCell" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Drag handle - only show if not pinned and depth is 0 */}
          {!config.pinned && depth === 0 && (
            <button
              className="sec__drag"
              {...attributes}
              {...listeners}
              title="Drag to reorder"
            >
              ⠿
            </button>
          )}
          {hasChildren ? (
            <button
              className="sec__caret"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "▸" : "▾"}
            </button>
          ) : (
            <span style={{ width: "16px", display: "inline-block" }} />
          )}
        </div>

        {/* Label */}
        <div className="sec__label">
          <input
            type="text"
            className="income-item__label-input"
            value={item.label}
            onChange={(e) => onUpdate(item.id, { label: e.target.value })}
            readOnly={config.calculated}
            style={{
              background: "transparent",
              border: "1px solid transparent",
              padding: "4px 8px",
              width: "100%",
              fontSize: "0.85rem",
            }}
          />
        </div>

        {/* Value columns - using display: contents like the old structure */}
        <div className="sec__values">
          <div className="leaf-editor">
            {showMonthly && (
              <>
                <input
                  type="number"
                  value={formatValue(displayValues.rateMonthly)}
                  onChange={(e) => handleChange("rateMonthly", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
                <input
                  type="number"
                  value={formatValue(displayValues.grossMonthly)}
                  onChange={(e) => handleChange("grossMonthly", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
                <input
                  type="number"
                  value={formatValue(displayValues.psfMonthly)}
                  onChange={(e) => handleChange("psfMonthly", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
                <input
                  type="number"
                  value={formatValue(displayValues.punitMonthly)}
                  onChange={(e) => handleChange("punitMonthly", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
              </>
            )}

            {showAnnual && (
              <>
                <input
                  type="number"
                  value={formatValue(displayValues.rateAnnual)}
                  onChange={(e) => handleChange("rateAnnual", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
                <input
                  type="number"
                  value={formatValue(displayValues.grossAnnual)}
                  onChange={(e) => handleChange("grossAnnual", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
                <input
                  type="number"
                  value={formatValue(displayValues.psfAnnual)}
                  onChange={(e) => handleChange("psfAnnual", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
                <input
                  type="number"
                  value={formatValue(displayValues.punitAnnual)}
                  onChange={(e) => handleChange("punitAnnual", e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="0"
                />
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="sec__actions">
          {config.allowSub && (
            <button
              className="sub-btn"
              onClick={() => onAddChild(item.id, path)}
              title="Add sub-item"
            >
              + Sub
            </button>
          )}
          {config.allowClone && (
            <button
              className="sub-btn"
              onClick={() => onClone(item.id)}
              title="Clone item"
            >
              Clone
            </button>
          )}
          {config.allowDelete && (
            <button
              className="danger-btn"
              onClick={() => onDelete(item.id, path)}
              title="Delete item"
            >
              ✖
            </button>
          )}
        </div>
      </div>

      {/* Recursively render children */}
      {hasChildren && !collapsed && (
        <>
          {item.childOrder.map((childId) => {
            const child = item.children[childId];
            if (!child) return null;

            return (
              <IncomeItem
                key={childId}
                item={child}
                depth={depth + 1}
                onUpdate={(childItemId, updates) => {
                  // Delegate to parent with child context
                  onUpdate(item.id, {
                    children: {
                      ...item.children,
                      [childItemId]: {
                        ...child,
                        ...updates,
                      },
                    },
                  });
                }}
                onAddChild={onAddChild}
                onClone={onClone}
                onDelete={onDelete}
                sectionKey={sectionKey}
                order={order}
                grossBuildingAreaSqFt={grossBuildingAreaSqFt}
                units={units}
                path={[...path, item.id]} // Pass the path down
              />
            );
          })}
        </>
      )}
    </>
  );
}
