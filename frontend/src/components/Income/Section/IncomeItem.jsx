import React, { useState, useMemo } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { getItemConfig, isDeductionItem, SPECIAL_IDS } from "@/utils/income/incomeConfig";
import { useIncomeView } from "@/app/providers/IncomeViewProvider";
import { calculateValues, sumChildrenValues, isVacancyItem } from "@/utils/income/incomeCalculations";
import AccountingInput from "@/components/common/AccountingInput";
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
  sectionItems = {}, // All items in the section for accessing GSR
}) {
  const { displayMode, rateDecimalPlaces } = useIncomeView();
  const [collapsed, setCollapsed] = useState(false);
  const [cloneCount, setCloneCount] = useState("");

  const config = getItemConfig(item.id);
  const hasChildren = item.childOrder && item.childOrder.length > 0;
  const isSubtotal = item.isSubtotal === true;
  const isGSR = item.id === SPECIAL_IDS.GROSS_SCHEDULED_RENT;

  // Check if this is a special total row (Total Operating Income, Total Income, etc.)
  const isTotalRow = item.id === SPECIAL_IDS.TOTAL_INCOME ||
                     item.id === SPECIAL_IDS.TOTAL_OPERATING_EXPENSES ||
                     item.id === SPECIAL_IDS.TOTAL_CAPITAL_EXPENSES;

  // Check if this item should have forced negative values (deductions)
  // For nested items, check the root parent
  const rootId = path.length > 0 ? path[0] : item.id;
  const forceNegative = isDeductionItem(sectionKey, rootId, order);

  // Drag & drop - enable for non-pinned, non-subtotal items
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: config.pinned || isSubtotal, // Disable dragging for pinned items and subtotals
  });

  // Sensors for child drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate display values based on item type
  const displayValues = useMemo(() => {
    if (hasChildren) {
      // Parent with children: sum all children (excluding subtotals)
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

  // Handle drag end for child items
  const handleChildDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if the active item is the subtotal (don't allow dragging it)
    const activeChild = item.children[active.id];
    if (activeChild?.isSubtotal) return;

    const oldIndex = item.childOrder.indexOf(active.id);
    const newIndex = item.childOrder.indexOf(over.id);

    const newChildOrder = arrayMove(item.childOrder, oldIndex, newIndex);

    // Update parent with new child order
    onUpdate(item.id, { childOrder: newChildOrder });
  };

  // Handle input changes with auto-calculations
  const handleChange = (field, value) => {
    const numValue = parseFloat(value) || 0;

    // Calculate all derived values
    let calculatedUpdates = calculateValues(
      field,
      numValue,
      item,
      grossBuildingAreaSqFt,
      units,
      forceNegative
    );

    // SPECIAL: If this is the vacancy item and rate was edited, calculate Gross from GSR
    if (isVacancyItem(item) && field.includes("rate")) {
      const gsrItem = sectionItems["gsr"] || sectionItems["Gross Scheduled Rent"];
      if (gsrItem) {
        // Get GSR's gross values (sum children if it has them)
        const gsrGross = gsrItem.childOrder && gsrItem.childOrder.length > 0
          ? sumChildrenValues(gsrItem)
          : {
              grossMonthly: gsrItem.grossMonthly || 0,
              grossAnnual: gsrItem.grossAnnual || 0,
            };

        // Calculate vacancy gross as: GSR Gross * (Rate / 100)
        // Make it negative since it's a deduction
        const rate = numValue / 100; // Convert percentage to decimal
        calculatedUpdates.grossAnnual = -Math.round((gsrGross.grossAnnual * rate) * 100) / 100;
        calculatedUpdates.grossMonthly = -Math.round((gsrGross.grossMonthly * rate) * 100) / 100;

        // Recalculate PSF and PUnit based on new Gross
        if (grossBuildingAreaSqFt > 0) {
          calculatedUpdates.psfMonthly = Math.round((calculatedUpdates.grossMonthly / grossBuildingAreaSqFt) * 100) / 100;
          calculatedUpdates.psfAnnual = Math.round((calculatedUpdates.grossAnnual / grossBuildingAreaSqFt) * 100) / 100;
        }
        if (units > 0) {
          calculatedUpdates.punitMonthly = Math.round((calculatedUpdates.grossMonthly / units) * 100) / 100;
          calculatedUpdates.punitAnnual = Math.round((calculatedUpdates.grossAnnual / units) * 100) / 100;
        }
      }
    }

    // Update with all calculated values
    onUpdate(item.id, calculatedUpdates);
  };

  // Format number for display
  const formatValue = (val) => {
    if (!val || val === 0) return "";
    return val.toString();
  };

  // Format rate for display (as percentage with configurable decimals)
  const formatRate = (val) => {
    if (!val || val === 0) return "";
    // Round to max 4 decimals
    const rounded = Math.round(val * 10000) / 10000;
    // Use configured decimal places (0-4)
    const decimals = Math.max(0, Math.min(4, rateDecimalPlaces));
    return rounded.toFixed(decimals);
  };

  // Parse rate from display (remove % if present)
  const parseRate = (val) => {
    if (!val) return 0;
    const str = val.toString().replace("%", "").trim();
    return parseFloat(str) || 0;
  };

  // Check if this is the vacancy item
  const isVacancy = isVacancyItem(item);

  // Inputs should be readonly if item has children OR if config says calculated OR if it's a subtotal
  const isReadOnly = hasChildren || config.calculated || isSubtotal;

  // Rate inputs are readonly for non-vacancy items (they should be calculated from Gross)
  const isRateReadOnly = isReadOnly || !isVacancy;

  // Use appropriate grid class based on depth
  const gridClass = depth === 0 ? "sec__rowGrid" : "sec__subRowGrid";

  // Handle clone input change and execution
  const handleCloneInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers 1-10
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 10)) {
      setCloneCount(value);
    }
  };

  const handleCloneExecute = () => {
    if (cloneCount && parseInt(cloneCount) >= 1 && parseInt(cloneCount) <= 10) {
      onClone(item.id, path, parseInt(cloneCount));
      setCloneCount(""); // Clear input after cloning
    }
  };

  const handleCloneKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCloneExecute();
    }
  };

  return (
    <>
      {/* Main row using Section's grid system */}
      <div
        className={`${gridClass} ${isSubtotal ? 'income-item--subtotal' : ''} ${isTotalRow ? 'income-item--total' : ''}`}
        ref={setNodeRef}
        style={style}
      >
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
        <div className="sec__label" style={{ paddingLeft: depth > 0 ? `${depth * 24}px` : "0" }}>
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
                {/* Rate input - empty placeholder for GSR to maintain grid alignment */}
                {isGSR ? (
                  <div style={{ visibility: "hidden" }}>
                    <input type="number" disabled />
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      value={formatRate(displayValues.rateMonthly)}
                      onChange={(e) => handleChange("rateMonthly", parseRate(e.target.value))}
                      readOnly={isRateReadOnly}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{ paddingRight: "20px" }}
                    />
                    <span style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#666",
                      fontSize: "0.85rem"
                    }}>%</span>
                  </div>
                )}
                <AccountingInput
                  value={displayValues.grossMonthly}
                  onChange={(val) => handleChange("grossMonthly", val)}
                  disabled={isReadOnly}
                  placeholder="0"
                  decimals={2}
                  symbolType="currency"
                />
                <AccountingInput
                  value={displayValues.psfMonthly}
                  onChange={(val) => handleChange("psfMonthly", val)}
                  disabled={isReadOnly}
                  placeholder="0"
                  decimals={2}
                  symbolType="psf"
                />
                <AccountingInput
                  value={displayValues.punitMonthly}
                  onChange={(val) => handleChange("punitMonthly", val)}
                  disabled={isReadOnly}
                  placeholder="0"
                  decimals={2}
                  symbolType="punit"
                />
              </>
            )}

            {showAnnual && (
              <>
                {/* Rate input - empty placeholder for GSR to maintain grid alignment */}
                {isGSR ? (
                  <div style={{ visibility: "hidden" }}>
                    <input type="number" disabled />
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      value={formatRate(displayValues.rateAnnual)}
                      onChange={(e) => handleChange("rateAnnual", parseRate(e.target.value))}
                      readOnly={isRateReadOnly}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{ paddingRight: "20px" }}
                    />
                    <span style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#666",
                      fontSize: "0.85rem"
                    }}>%</span>
                  </div>
                )}
                <AccountingInput
                  value={displayValues.grossAnnual}
                  onChange={(val) => handleChange("grossAnnual", val)}
                  disabled={isReadOnly}
                  placeholder="0"
                  decimals={2}
                  symbolType="currency"
                />
                <AccountingInput
                  value={displayValues.psfAnnual}
                  onChange={(val) => handleChange("psfAnnual", val)}
                  disabled={isReadOnly}
                  placeholder="0"
                  decimals={2}
                  symbolType="psfyr"
                />
                <AccountingInput
                  value={displayValues.punitAnnual}
                  onChange={(val) => handleChange("punitAnnual", val)}
                  disabled={isReadOnly}
                  placeholder="0"
                  decimals={2}
                  symbolType="punityr"
                />
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="sec__actions">
          {!isSubtotal && config.allowSub && depth < 2 && (
            <button
              className="sub-btn"
              onClick={() => onAddChild(item.id, path)}
              title="Add sub-item"
            >
              + Sub
            </button>
          )}
          {!isSubtotal && config.allowClone && (
            <input
              type="number"
              className="clone-input"
              value={cloneCount}
              onChange={handleCloneInputChange}
              onBlur={handleCloneExecute}
              onKeyDown={handleCloneKeyDown}
              placeholder="Clone"
              min="1"
              max="10"
              title="Enter number of clones (1-10)"
              style={{
                width: "60px",
                padding: "4px 6px",
                fontSize: "0.75rem",
                textAlign: "center",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            />
          )}
          {!isSubtotal && config.allowDelete && (
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChildDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={item.childOrder} strategy={verticalListSortingStrategy}>
            {item.childOrder.map((childId) => {
              const child = item.children[childId];
              if (!child) return null;

              // If this child is a subtotal, inject the calculated sum of siblings
              let childToRender = child;
              if (child.isSubtotal) {
                // Calculate sum of all non-subtotal siblings
                const siblingSum = sumChildrenValues(item); // This already excludes subtotals
                childToRender = {
                  ...child,
                  ...siblingSum, // Inject the calculated values
                };
              }

              return (
                <IncomeItem
                  key={childId}
                  item={childToRender}
                  depth={child.isSubtotal ? depth : depth + 1} // Subtotal uses parent's depth
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
                  sectionItems={sectionItems} // Pass section items down
                />
              );
            })}
          </SortableContext>
        </DndContext>
      )}
    </>
  );
}
