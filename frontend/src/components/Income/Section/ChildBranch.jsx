// components/Income/Section/ChildBranch.jsx
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

import BranchTotals from "../BranchTotals.jsx";
import ChildLeaf from "./ChildLeaf.jsx";
import SortableRow from "./SortableRow.jsx";

import { isLeafNode, isPO } from "@domain/incomeSection/structureHelpers.js";
import {
  FIXED_FIRST_INCOME_KEY,
  FIXED_DIVIDER_INCOME_KEY,
} from "@constants/incomeKeys.js";

export default function ChildBranch({
  sectionTitle,
  depth = 0,
  val,
  collapsedPaths,
  displayMode,
  metrics,
  handleAdd,
  handleDelete,
  handlePromote,
  handleSetAtPath,
}) {
  const collapsed = collapsedPaths.has(sectionTitle);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  // The localKeys are: Gross Scheduled Rent, Vacancy/Collections Loss, Less - Free Rent and/or Allowances, Less - Other Adjustments, Net Rental Income, Recoverable Income, Other Income
  // and so on for other sections: Income, Operating Expenses, Capital Expenses
  const localKeys = Object.keys(val || {});

  const onLocalDragEnd = (event) => {
    const activeId = event.active?.id;
    const overId = event.over?.id;
    if (!overId || activeId === overId) return;

    const fromKey = activeId;
    const toKey = overId;

    // reorder logic unchanged
    if (sectionTitle === "") {
      handleSetAtPath("", (prevData) => {
        const keys = Object.keys(prevData);
        const from = keys.indexOf(fromKey);
        const to = keys.indexOf(toKey);
        if (from < 0 || to < 0) return prevData;

        if (
          [FIXED_FIRST_INCOME_KEY, FIXED_DIVIDER_INCOME_KEY].includes(
            fromKey
          ) ||
          [FIXED_FIRST_INCOME_KEY, FIXED_DIVIDER_INCOME_KEY].includes(toKey)
        )
          return prevData;

        const reordered = {};
        const reorderedKeys = [...keys];
        const [moved] = reorderedKeys.splice(from, 1);
        reorderedKeys.splice(to, 0, moved);
        reorderedKeys.forEach((k) => (reordered[k] = prevData[k]));
        return reordered;
      });
      return;
    }

    handleSetAtPath(sectionTitle, (prevBranch) => {
      if (!isPO(prevBranch)) return prevBranch;
      const keys = Object.keys(prevBranch);
      const from = keys.indexOf(fromKey);
      const to = keys.indexOf(toKey);
      if (from < 0 || to < 0) return prevBranch;

      const reorderedKeys = [...keys];
      const [moved] = reorderedKeys.splice(from, 1);
      reorderedKeys.splice(to, 0, moved);

      const reorderedBranch = {};
      reorderedKeys.forEach((k) => (reorderedBranch[k] = prevBranch[k]));
      return reorderedBranch;
    });
  };

  if (!val || typeof val !== "object") return null;

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
      onDragEnd={onLocalDragEnd}
    >
      <SortableContext items={localKeys} strategy={verticalListSortingStrategy}>

        {localKeys.map((key) => {

          const fullPath = sectionTitle ? `${sectionTitle}.${key}` : key; //Income.New 
          const node = val[key]; 
          const isLeaf = isLeafNode(node);
          const isCollapsed = collapsedPaths.has(fullPath);

          return (
            <SortableRow
              key={fullPath}
              id={key}
              mainRow={
                {
                leading: !isLeaf ? (
                  <button
                    className="sec__caret"
                    onClick={() => handleSetAtPath(fullPath)}
                  >
                    {isCollapsed ? "▸" : "▾"}
                  </button>
                ) : null,
                label: key,
                values: isLeaf ? (
                  <ChildLeaf
                    fullPath={fullPath} //Income.New
                    label={key} //"New"
                    val={node} //grossAnnual:0, psfAnnual:0, punitAnnual:0, rateAnnual:0, grossMonthly:0, psfMonthly:0, punitMonthly:0, rateMonthly:0
                    displayMode={displayMode}
                    metrics={metrics}
                    handleSetAtPath={handleSetAtPath}
                    handlePromote={handlePromote}
                    handleDelete={handleDelete}
                    fullData={val} // passes whole Income object
                  />
                ) : (<BranchTotals value={node} displayMode={displayMode} />),
              }
            }
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
                    handleAdd={handleAdd}
                    handleDelete={handleDelete}
                    handlePromote={handlePromote}
                    handleSetAtPath={handleSetAtPath}
                    fullData={val}
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
