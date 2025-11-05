import React, { useState, useMemo } from "react";
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
import {
  addItemToSection,
  addChildItem,
  deleteItem,
  deleteChildItem,
  cloneItem,
  cloneChildItem,
  updateItem,
  updateChildItem,
} from "@/utils/income/incomeDataHelpers.js";
import { calculateNetRentalIncome } from "@/utils/income/incomeCalculations.js";
import { SPECIAL_IDS, getItemConfig } from "@/utils/income/incomeConfig.js";

// 🧱 Components
import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "@/components/Income/Section/SectionTotal.jsx";
import IncomeItem from "@/components/Income/Section/IncomeItem.jsx";

// 🎨 Styles
import "@styles/components/Income/Section.css";

/* -------------------------------------------------------------------------- */
/* 💼 Section – Renders a section with items                                  */
/* -------------------------------------------------------------------------- */
export default function Section({
  title,
  sectionKey, // "Income", "OperatingExpenses", "CapitalExpenses"
  data = {},
  onUpdateSection,
  grossBuildingAreaSqFt = 0,
  units = 0,
  baselineData = null,
}) {
  const { prompt, confirm } = useDialog();
  const { displayMode: globalDisplayMode } = useIncomeView();

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

    const label = await prompt({
      title: "New sub-item",
      message: `Parent: ${parentLabel}`,
      placeholder: "e.g., Sub-item",
    });

    if (label) {
      const updated = addChildItem(data, parentId, label, path);
      onUpdateSection(updated);
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

    const ok = await confirm({
      title: "Delete this item?",
      message: `This will remove "${itemLabel}" and its sub-items.`,
    });

    if (ok) {
      const updated = deleteChildItem(data, itemId, path);
      onUpdateSection(updated);
    }
  };

  const handleClone = (itemId) => {
    const updated = cloneItem(data, itemId);
    onUpdateSection(updated);
  };

  const handleUpdate = (itemId, updates) => {
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

  return (
    <div className={`sec ${modeClass}`}>
      {hasHeader && (
        <div className="sec__header">
          <div className="sec__headerGrid">
            <div className="sec__firstCell">
              <button
                className="sec__caret"
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? "Expand" : "Collapse"}
              >
                {collapsed ? "▸" : "▾"}
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

      {(!hasHeader || !collapsed) && (
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
}
