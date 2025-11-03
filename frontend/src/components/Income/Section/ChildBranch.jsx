import React from "react";
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
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// 🧩 Context + Helpers
import { useIncome } from "@/app/providers/IncomeProvider.jsx";
import { isLeafNode } from "@domain/incomeSection/structureHelpers.js";
import {
  FIXED_FIRST_INCOME_KEY,
  FIXED_DIVIDER_INCOME_KEY,
} from "@constants/incomeKeys.js";
import { sortIncomeSection } from "@/constants/sortSection.js";

// 🧱 Components
import BranchTotals from "../BranchTotals.jsx";
import ChildLeaf from "./ChildLeaf.jsx";
import SortableRow from "./SortableRow.jsx";

/* -------------------------------------------------------------------------- */
/* 🌿 ChildBranch – provider-based recursive branch renderer                   */
/* -------------------------------------------------------------------------- */

// 🔹 Helper to safely get nested object value by "a.b.c" path
const getByPath = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc && acc[key] ? acc[key] : null), obj);

// 🔹 Helper to safely set nested object by path (immutable)
const setByPath = (obj, path, value) => {
  const keys = path.split(".");
  const last = keys.pop();
  const clone = structuredClone(obj);
  let current = clone;
  for (const k of keys) {
    if (!current[k]) current[k] = {};
    current = current[k];
  }
  current[last] = value;
  return clone;
};

export default function ChildBranch({
  sectionTitle,
  depth = 0,
  val,
  collapsedPaths,
  displayMode,
  metrics,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const { data, setData, addItem } = useIncome();

  // 🔄 Always use the *live* provider data (prevents stale val)
  const branchData =
    sectionTitle && sectionTitle.includes(".")
      ? getByPath(data, sectionTitle)
      : data?.[sectionTitle] || val || {};

  if (!branchData || typeof branchData !== "object") return null;

  /* ------------------------------------------------------------------------ */
  /* 🧩 FIX: dive into .Sub automatically if it exists                        */
  /* ------------------------------------------------------------------------ */
  const branchCore =
    branchData.Sub && typeof branchData.Sub === "object"
      ? branchData.Sub
      : branchData;

  const localKeys = Object.keys(branchCore);
  const collapsed = collapsedPaths.has(sectionTitle);

  /* ------------------------------------------------------------------------ */
  /* 🔹 Drag Reorder Logic                                                    */
  /* ------------------------------------------------------------------------ */
  const onLocalDragEnd = (event) => {
    const activeId = event.active?.id;
    const overId = event.over?.id;
    if (!overId || activeId === overId) return;

    const fromKey = activeId.split(".").pop();
    const toKey = overId.split(".").pop();

    const keys = Object.keys(branchCore);
    const from = keys.indexOf(fromKey);
    const to = keys.indexOf(toKey);
    if (from < 0 || to < 0) return;

    // 🛡️ Skip locked rows
    if (
      [FIXED_FIRST_INCOME_KEY, FIXED_DIVIDER_INCOME_KEY].includes(fromKey) ||
      [FIXED_FIRST_INCOME_KEY, FIXED_DIVIDER_INCOME_KEY].includes(toKey)
    ) {
      console.warn("Attempted to move a locked item — ignored.");
      return;
    }

    // 🔄 Perform reorder
    const reorderedKeys = [...keys];
    const [moved] = reorderedKeys.splice(from, 1);
    reorderedKeys.splice(to, 0, moved);

    const reorderedBranch = {};
    reorderedKeys.forEach((k) => (reorderedBranch[k] = branchCore[k]));

    // 🧩 Sort + update provider cleanly
    const newData =
      sectionTitle === "Income"
        ? setByPath(data, sectionTitle, sortIncomeSection(reorderedBranch))
        : setByPath(data, sectionTitle, reorderedBranch);

    setData(newData);
  };

  /* ------------------------------------------------------------------------ */
  /* 🔹 Render Rows                                                           */
  /* ------------------------------------------------------------------------ */
  const itemIds = localKeys.map((key) =>
    sectionTitle ? `${sectionTitle}.${key}` : key
  );

  console.log("[ChildBranch render]", sectionTitle, localKeys);

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
      onDragEnd={onLocalDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {localKeys.map((key) => {
          const fullPath = sectionTitle ? `${sectionTitle}.${key}` : key;
          const node = branchCore[key];
          const isLeaf = isLeafNode(node);
          const isCollapsed = collapsedPaths.has(fullPath);

          return (
            <SortableRow
              key={fullPath}
              id={fullPath}
              mainRow={{
                leading: !isLeaf ? (
                  <button
                    className="sec__caret"
                    onClick={() => {
                      addItem(fullPath, "Sub Item");
                      collapsedPaths.delete(fullPath); // 🧩 auto-expand after adding
                    }}
                  >
                    {isCollapsed ? "▸" : "▾"}
                  </button>
                ) : null,
                label: key,
                values: isLeaf ? (
                  <ChildLeaf
                    fullPath={fullPath}
                    label={key}
                    val={node}
                    displayMode={displayMode}
                    metrics={metrics}
                  />
                ) : (
                  <BranchTotals value={node} displayMode={displayMode} />
                ),
              }}
              childrenBelow={
                !isLeaf &&
                !isCollapsed && (
                  <ChildBranch
                    sectionTitle={fullPath}
                    depth={depth + 1}
                    val={node}
                    collapsedPaths={collapsedPaths}
                    displayMode={displayMode}
                    metrics={metrics}
                  />
                )
              }
            />
          );
        })}
      </SortableContext>
    </DndContext>
  );
}
