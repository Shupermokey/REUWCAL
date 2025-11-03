import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// 🧩 Context + Helpers
import { useIncome } from "@/app/providers/IncomeProvider.jsx";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useDialog } from "@/app/providers/DialogProvider.jsx";
import { isPO } from "@domain/incomeSection/structureHelpers.js";

// 🧱 Components
import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "@/components/Income/Section/SectionTotal.jsx";
import ChildBranch from "./ChildBranch.jsx";

// 🎨 Styles
import "@styles/components/Income/Section.css";

/* -------------------------------------------------------------------------- */
/* 💼 Section – Context-based, stateless, no prop drilling                    */
/* -------------------------------------------------------------------------- */
export default function Section({
  title,
  sectionKey, // "Income", "OperatingExpenses", "CapitalExpenses"
  data = {},
  metrics,
  displayMode,
}) {
  const { prompt, confirm } = useDialog();
  const { displayMode: globalDisplayMode } = useIncomeView();
  const { addItem, deleteItem, save } = useIncome();

  const [collapsed, setCollapsed] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());
  const modeClass =
    (displayMode || globalDisplayMode) === "both"
      ? "mode-both"
      : (displayMode || globalDisplayMode) === "monthly"
      ? "mode-monthly"
      : "mode-annual";

  // --- Add / Delete ----------------------------------------------------------
  const handleAdd = async (path = "") => {
    const label = await prompt({
      title: "New line item",
      message: path
        ? `Parent: ${path}`
        : `Add to ${title ?? "Section"}`,
      placeholder: "e.g., Landscaping",
    });
    if (label) addItem(path || sectionKey, label);
  };

  const handleDelete = async (path) => {
    const ok = await confirm({
      title: "Delete this item?",
      message: `This will remove "${path}" and its sub-items.`,
    });
    if (ok) deleteItem(path);
  };

  // --- Collapse Controls -----------------------------------------------------
  const handleCollapseAll = () => {
    setCollapsedPaths(new Set(Object.keys(data)));
  };

  const handleExpandAll = () => {
    setCollapsedPaths(new Set());
  };

  // --- Render ---------------------------------------------------------------
  const hasHeader = !!title;

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
              <button className="add-btn" onClick={() => handleAdd()}>
                + Item
              </button>
            </div>
          </div>
        </div>
      )}

      {(!hasHeader || !collapsed) && (
        <>
          <ChildBranch
            sectionTitle={sectionKey}
            depth={0}
            val={data}
            collapsedPaths={collapsedPaths}
            displayMode={displayMode || globalDisplayMode}
            metrics={metrics}
          />
          <SectionTotal data={data} title={title} />
        </>
      )}
    </div>
  );
}
