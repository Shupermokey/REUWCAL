import React, { useState, useMemo, useImperativeHandle } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// 🧩 Context + Helpers
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useDialog } from "@/app/providers/DialogProvider.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import {
  addItemToSection,
  addChildItem,
  addChildrenWithSubtotal,
  deleteItem,
  deleteChildItem,
  cloneItem,
  cloneChildItem,
  updateItem,
  updateChildItem,
} from "@/utils/income/incomeDataHelpers.js";
import { calculateNetRentalIncome } from "@/utils/income/incomeCalculations.js";
import { SPECIAL_IDS, getItemConfig } from "@/utils/income/incomeConfig.js";
import {
  isAddingUnits,
  getParentUnitType,
  getItemByPath,
  addLinkedUnitIdToItem,
  getLinkedUnitId,
} from "@/utils/income/unitDetection.js";
import {
  createLinkedUnit,
  deleteLinkedUnit,
  deleteLinkedHeader,
  updateLinkedUnitName,
  updateLinkedUnitRent,
  transformUnitToHeader,
  updateLinkedHeaderName,
} from "@/services/unitSyncService.js";

// 🧱 Components
import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "@/components/Income/Section/SectionTotal.jsx";
import IncomeItem from "@/components/Income/Section/IncomeItem.jsx";

// 🎨 Styles
import "@styles/components/Income/Section.css";

/* -------------------------------------------------------------------------- */
/* 💼 Section – Renders a section with items                                  */
/* -------------------------------------------------------------------------- */
const Section = React.forwardRef(({
  title,
  sectionKey, // "Income", "OperatingExpenses", "CapitalExpenses"
  data = {},
  onUpdateSection,
  grossBuildingAreaSqFt = 0,
  units = 0,
  baselineData = null,
  isSticky = false,
  isCollapsed = false,
  onToggleCollapse = () => {},
  propertyId, // NEW: needed for unit sync
}, ref) => {
  const { prompt, confirm, promptMultiple } = useDialog();
  const { displayMode: globalDisplayMode } = useIncomeView();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Extract order and items from data
  const order = data.order || [];
  const items = data.items || {};

  // Calculate Net Rental Income for the Income section
  const nriCalculatedValues = useMemo(() => {
    if (sectionKey === "Income") {
      return calculateNetRentalIncome(data);
    }
    return null;
  }, [sectionKey, data]);

  // --- Add / Delete / Clone / Update -----------------------------------------

  const handleAddItem = async () => {
    const label = await prompt({
      title: "New line item",
      message: `Add to ${title ?? "Section"}`,
      placeholder: "e.g., Landscaping",
    });
    if (label) {
      const updated = addItemToSection(data, label);
      onUpdateSection(updated);
    }
  };

  // Expose handleAddItem to parent via ref
  useImperativeHandle(ref, () => ({
    addItem: handleAddItem,
  }));

  const handleAddChild = async (parentId, path = []) => {
    // Find the parent item's label by traversing the path
    let parentLabel = "Item";

    if (path.length === 0) {
      // Root item
      parentLabel = items[parentId]?.label || "Item";
    } else {
      // Nested item - traverse down the path
      let current = items[path[0]];
      for (let i = 1; i < path.length; i++) {
        current = current?.children?.[path[i]];
      }
      // Now current is the parent of parentId
      parentLabel = current?.children?.[parentId]?.label || "Item";
    }

    // Check if parent already has children (for nested items, we need to traverse)
    let hasExistingChildren = false;
    let parent = null;

    if (path.length === 0) {
      parent = items[parentId];
      hasExistingChildren = parent && parent.childOrder && parent.childOrder.length > 0;
    } else {
      // For nested items, traverse to find the parent
      let current = items[path[0]];
      for (let i = 1; i < path.length; i++) {
        current = current?.children?.[path[i]];
      }
      parent = current?.children?.[parentId];
      hasExistingChildren = parent && parent.childOrder && parent.childOrder.length > 0;
    }

    // Count non-subtotal children to determine if we're at the limit
    const currentChildCount = hasExistingChildren && parent
      ? parent.childOrder.filter(id => !parent.children[id]?.isSubtotal).length
      : 0;

    // Always use multi-item prompt (allows adding multiple at once, up to 10 total)
    const remainingSlots = 10 - currentChildCount;

    if (remainingSlots <= 0) {
      alert("Maximum of 10 sub-items reached.");
      return;
    }

    const labels = await promptMultiple({
      title: hasExistingChildren ? "Add More Sub-Items" : "Add Sub-Items",
      message: `Adding to: ${parentLabel} (${currentChildCount}/10 items)`,
      fields: hasExistingChildren
        ? [{ label: "New Sub-Item", placeholder: "e.g., New Item" }]
        : [
            { label: "First Sub-Item", placeholder: "e.g., Item 1" },
            { label: "Second Sub-Item", placeholder: "e.g., Item 2" },
          ],
      maxFields: remainingSlots,
    });

    if (!labels || labels.length === 0) return;

    // If no existing children, need at least 1 item to create with subtotal
    if (!hasExistingChildren && labels.length < 1) {
      alert("Please add at least 1 sub-item.");
      return;
    }

    // Check if these are units (e.g., "Unit 1" under "Studio")
    const areUnits = isAddingUnits(parentId, path, sectionKey);

    if (areUnits && user && propertyId) {
      // Get the unit type (e.g., "Studio", "One Bedroom")
      const unitType = getParentUnitType(parentId, path, data);

      // Check if parent has linkedUnitId (is a plain unit that needs transformation)
      let parentItem = null;
      if (path.length === 0) {
        parentItem = data.items[parentId];
      } else {
        let current = data.items[path[0]];
        for (let i = 1; i < path.length; i++) {
          current = current?.children?.[path[i]];
        }
        parentItem = current?.children?.[parentId];
      }

      const parentHasLinkedUnitId = parentItem?.linkedUnitId;
      const isFirstTimeAddingChildren = !parentItem?.childOrder || parentItem.childOrder.length === 0;

      // Transform plain unit to header if this is the first time adding children
      if (parentHasLinkedUnitId && isFirstTimeAddingChildren) {
        try {
          await transformUnitToHeader(user.uid, propertyId, parentItem.linkedUnitId, parentItem.label);
          console.log('Transformed plain unit to header');
        } catch (error) {
          console.error('Error transforming unit to header:', error);
        }
      }

      // Track accumulated updates across multiple units
      let accumulatedData = data;

      // Auto-link units without confirmation modal
      for (const label of labels) {
        try {
          console.log('Auto-creating unit - label:', label, 'parentId:', parentId, 'path:', path, 'unitType:', unitType);

          // Check if children exist in the ACCUMULATED data (not original data)
          let currentHasChildren = false;
          if (path.length === 0) {
            const currentParent = accumulatedData.items[parentId];
            currentHasChildren = currentParent && currentParent.childOrder && currentParent.childOrder.length > 0;
          } else {
            let current = accumulatedData.items[path[0]];
            for (let i = 1; i < path.length; i++) {
              current = current?.children?.[path[i]];
            }
            const currentParent = current?.children?.[parentId];
            currentHasChildren = currentParent && currentParent.childOrder && currentParent.childOrder.length > 0;
          }

          // Add to Income Statement first (use accumulated data)
          // Only create subtotal for the FIRST unit if no children exist yet
          let updated;
          if (!currentHasChildren) {
            updated = addChildrenWithSubtotal(accumulatedData, parentId, [label], path);
          } else {
            updated = addChildItem(accumulatedData, parentId, label, path);
          }

          console.log('Updated data after add:', updated);

          // Find the actual new item ID
          let newItemId;
          let newItem;

          if (path.length === 0) {
            // Root level
            const parent = updated.items[parentId];
            console.log('Root level parent:', parent);
            newItemId = parent.childOrder.find(
              id => parent.children[id].label === label && !parent.children[id].isSubtotal
            );
            newItem = parent.children[newItemId];
          } else {
            // Nested
            let current = updated.items[path[0]];
            for (let i = 1; i < path.length; i++) {
              current = current.children[path[i]];
            }
            console.log('Nested current:', current);
            const parent = current.children[parentId];
            console.log('Nested parent:', parent);
            newItemId = parent.childOrder.find(
              id => parent.children[id].label === label && !parent.children[id].isSubtotal
            );
            newItem = parent.children[newItemId];
          }

          console.log('Found newItemId:', newItemId, 'newItem:', newItem);

          if (!newItemId || !newItem) {
            throw new Error('Could not find newly created item');
          }

          // Create in Units table and get linkedUnitId
          const { unitId } = await createLinkedUnit(
            user.uid,
            propertyId,
            {
              id: newItemId,
              label: newItem.label,
              grossMonthly: newItem.grossMonthly || 0
            },
            unitType
          );

          console.log('Created unit with ID:', unitId);

          // Update the Income Statement item with linkedUnitId
          updated = addLinkedUnitIdToItem(newItemId, [...path, parentId], unitId, updated);

          console.log('Updated data with linkedUnitId:', updated);

          // Update accumulated data for next iteration
          accumulatedData = updated;

          onUpdateSection(updated);
        } catch (error) {
          console.error('Error creating linked unit:', error);
          console.error('Error details:', error.message, error.stack);
          alert(`Failed to create unit: ${error.message}`);
        }
      }
    } else {
      // Normal flow (not units)
      if (!hasExistingChildren) {
        // First time: create children with subtotal
        const updated = addChildrenWithSubtotal(data, parentId, labels, path);
        onUpdateSection(updated);
      } else {
        // Subsequent times: add items one by one (they'll be inserted before subtotal)
        let updated = data;
        labels.forEach(label => {
          updated = addChildItem(updated, parentId, label, path);
        });
        onUpdateSection(updated);
      }
    }
  };

  const handleDelete = async (itemId, path = []) => {
    // Find the item's label by traversing the path
    let itemLabel = "Item";

    if (path.length === 0) {
      // Root item
      itemLabel = items[itemId]?.label || "Item";
    } else {
      // Nested item - traverse down the path
      let current = items[path[0]];
      for (let i = 1; i < path.length; i++) {
        current = current?.children?.[path[i]];
      }
      // Now current is the parent of itemId
      itemLabel = current?.children?.[itemId]?.label || "Item";
    }

    // Check if this item has a linkedUnitId
    const linkedUnitId = getLinkedUnitId(itemId, path, data);

    // Check if this item is a header (has children)
    let isHeader = false;
    let itemToDelete = null;
    if (path.length === 0) {
      itemToDelete = items[itemId];
    } else {
      let current = items[path[0]];
      for (let i = 1; i < path.length; i++) {
        current = current?.children?.[path[i]];
      }
      itemToDelete = current?.children?.[itemId];
    }
    isHeader = itemToDelete?.children && Object.keys(itemToDelete.children).length > 0;

    // Confirm deletion
    const ok = await confirm({
      title: "Delete this item?",
      message: linkedUnitId || isHeader
        ? `This will remove "${itemLabel}" and all its sub-items from both Income Statement and Units table.`
        : `This will remove "${itemLabel}" and its sub-items.`,
    });

    if (ok) {
      try {
        // Delete from Income Statement
        const updated = deleteChildItem(data, itemId, path);
        onUpdateSection(updated);

        // If this is a header with children, delete the entire header from Units
        if (isHeader && itemLabel && user && propertyId) {
          await deleteLinkedHeader(user.uid, propertyId, itemLabel);
        }
        // Otherwise if linked, delete the individual unit from Units table
        else if (linkedUnitId && user && propertyId) {
          await deleteLinkedUnit(user.uid, propertyId, linkedUnitId);
        }
      } catch (error) {
        console.error('Error deleting unit:', error);
        alert('Failed to delete unit. Please try again.');
      }
    }
  };

  const handleClone = (itemId, path = [], numClones = 1) => {
    // Validate clone count
    if (!numClones || numClones < 1 || numClones > 10) {
      return;
    }

    // Clone the item multiple times
    let updated = data;
    for (let i = 0; i < numClones; i++) {
      if (path.length === 0) {
        // Root item
        updated = cloneItem(updated, itemId);
      } else {
        // Child item
        updated = cloneChildItem(updated, itemId, path);
      }
    }

    onUpdateSection(updated);
  };

  const handleUpdate = async (itemId, updates) => {
    // Get the current item being updated
    const currentItem = items[itemId];

    // Case 1: Direct update to an item with linkedUnitId (plain unit or header)
    if (user && propertyId && currentItem?.linkedUnitId) {
      // Check if this is a header (has children) or a plain unit
      const isHeader = currentItem.children && Object.keys(currentItem.children).length > 0;

      // Sync label changes
      if (updates.label !== undefined && updates.label !== currentItem.label) {
        try {
          if (isHeader) {
            // Sync header name change
            await updateLinkedHeaderName(user.uid, propertyId, currentItem.label, updates.label);
          } else {
            // Sync plain unit name change
            await updateLinkedUnitName(user.uid, propertyId, currentItem.linkedUnitId, updates.label);
          }
        } catch (error) {
          console.error('Error syncing name to Units:', error);
        }
      }

      // Sync rent changes (grossMonthly) - only for plain units, not headers
      if (!isHeader && updates.grossMonthly !== undefined && updates.grossMonthly !== currentItem.grossMonthly) {
        try {
          await updateLinkedUnitRent(user.uid, propertyId, currentItem.linkedUnitId, updates.grossMonthly);
        } catch (error) {
          console.error('Error syncing rent to Units:', error);
        }
      }
    }

    // Case 2: Update includes nested children with linkedUnitId
    if (user && propertyId && updates.children) {
      // This is a parent update that includes child updates
      // Check each child for linkedUnitId and sync
      for (const [childId, childUpdates] of Object.entries(updates.children)) {
        const currentChild = currentItem?.children?.[childId];

        if (currentChild?.linkedUnitId) {
          // Sync label changes
          if (childUpdates.label !== undefined && childUpdates.label !== currentChild.label) {
            try {
              await updateLinkedUnitName(user.uid, propertyId, currentChild.linkedUnitId, childUpdates.label);
            } catch (error) {
              console.error('Error syncing name to Units:', error);
            }
          }

          // Sync rent changes (grossMonthly)
          if (childUpdates.grossMonthly !== undefined && childUpdates.grossMonthly !== currentChild.grossMonthly) {
            try {
              await updateLinkedUnitRent(user.uid, propertyId, currentChild.linkedUnitId, childUpdates.grossMonthly);
            } catch (error) {
              console.error('Error syncing rent to Units:', error);
            }
          }
        }
      }
    }

    // Update the Income Statement
    const updated = updateItem(data, itemId, updates);
    onUpdateSection(updated);
  };

  // --- Drag & Drop ----------------------------------------------------------
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Only check if the ACTIVE item is pinned (don't allow dragging pinned items)
    // But DO allow dropping on/near pinned items
    const activeConfig = getItemConfig(active.id);

    if (activeConfig.pinned) {
      // Don't allow dragging pinned items
      return;
    }

    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);

    // Reorder the array
    const newOrder = arrayMove(order, oldIndex, newIndex);

    // Update the section with new order
    onUpdateSection({
      ...data,
      order: newOrder,
    });
  };

  // --- Render ---------------------------------------------------------------
  const hasHeader = !!title;

  const modeClass =
    globalDisplayMode === "both"
      ? "mode-both"
      : globalDisplayMode === "monthly"
      ? "mode-monthly"
      : "mode-annual";

  // Use scroll-based collapse if provided, otherwise use local state
  const effectivelyCollapsed = isCollapsed || collapsed;

  return (
    <div
      ref={ref}
      className={`sec ${modeClass} ${isSticky ? 'sec--sticky' : ''} ${effectivelyCollapsed ? 'sec--collapsed' : ''}`}
    >
      {hasHeader && (
        <div className="sec__header">
          <div className="sec__headerGrid">
            <div className="sec__firstCell">
              <button
                className="sec__caret"
                onClick={() => {
                  if (isCollapsed) {
                    onToggleCollapse();
                  } else {
                    setCollapsed((c) => !c);
                  }
                }}
                title={effectivelyCollapsed ? "Expand" : "Collapse"}
              >
                {effectivelyCollapsed ? "▸" : "▾"}
              </button>
            </div>

            <div className="sec__label">
              <span className="sec__labelText">{title}</span>
            </div>

            <div className="sec__values">
              <ValueColumns />
            </div>

            <div className="sec__actions sec__headerActions">
              <button className="add-btn" onClick={handleAddItem}>
                + Item
              </button>
            </div>
          </div>
        </div>
      )}

      {(!hasHeader || !effectivelyCollapsed) && (
        <>
          {/* Render all items with drag & drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {order.map((itemId) => {
                let item = items[itemId];
                if (!item) return null;

                // If this is NRI and we have calculated values, merge them in
                if (itemId === SPECIAL_IDS.NET_RENTAL_INCOME && nriCalculatedValues) {
                  item = {
                    ...item,
                    ...nriCalculatedValues,
                  };
                }

                return (
                  <IncomeItem
                    key={itemId}
                    item={item}
                    depth={0}
                    onUpdate={handleUpdate}
                    onAddChild={handleAddChild}
                    onClone={handleClone}
                    onDelete={handleDelete}
                    sectionKey={sectionKey}
                    order={order}
                    grossBuildingAreaSqFt={grossBuildingAreaSqFt}
                    units={units}
                    sectionItems={items}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Section Total */}
          <SectionTotal data={data} title={title} />
        </>
      )}
    </div>
  );
});

Section.displayName = 'Section';

export default Section;
