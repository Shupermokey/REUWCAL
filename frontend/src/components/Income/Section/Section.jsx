// components/Income/Section/Section.jsx
import React, { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useDialog } from "@/app/providers/DialogProvider.jsx";
import { LEAF_KEYS } from "@constants/incomeKeys.js";

import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "@/components/Income/Section/SectionTotal.jsx";
import ChildBranch from "./ChildBranch.jsx";

import {
  addItem,
  promoteToObject,
  deleteAtPath,
  setAtPath,
  collapseAll,
  expandAll,
} from "@domain/incomeSection";

import "@styles/components/Income/Section.css";

/* -------------------------------------------------------------------------- */
/* 💼 Section Component – stateless & Firestore-ready                         */
/* -------------------------------------------------------------------------- */
export default function Section({
  title,
  data = {},
  onChange,
  showTotal = true,
  lockKeys = new Set(),
  metrics = { gbaSqft: 0, units: 0 },
  deriveKeys = new Set(["Gross Scheduled Rent"]),
  fullPrefix = "",
}) {
  const { displayMode } = useIncomeView();
  const { prompt, confirm } = useDialog();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const modeClass =
    displayMode === "both"
      ? "mode-both"
      : displayMode === "monthly"
      ? "mode-monthly"
      : "mode-annual";

  // --- Action handlers -------------------------------------------------------
  const handleAdd = async (path = "") =>
    await addItem({ path, title, data, onChange, prompt });

  const handlePromote = async (path) =>
    await promoteToObject({ path, data, onChange, prompt });

  const handleDelete = async (path) =>
    await deleteAtPath({ path, data, onChange, confirm });

  const handleSetAtPath = useCallback(
    (path, updater) => setAtPath({ path, data, onChange, updater }),
    [data, onChange]
  );

  const handleCollapseAll = () => collapseAll(data, setCollapsedPaths);
  const handleExpandAll = () => expandAll(setCollapsedPaths);

  // ✅ new: live refresh trigger passed to all leaves
  const handleImmediateChange = useCallback(() => {
    onChange(structuredClone(data));
  }, [data, onChange]);

  const hasHeader = !!title;

  // --- Render ---------------------------------------------------------------
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
              <button className="add-btn" onClick={handleCollapseAll}>
                Collapse All
              </button>
              <button className="add-btn" onClick={handleExpandAll}>
                Expand All
              </button>
            </div>
          </div>
        </div>
      )}

      {(!hasHeader || !collapsed) && (
        <>
          <ChildBranch
            full={fullPrefix || ""}
            depth={0}
            val={data}
            collapsedPaths={collapsedPaths}
            displayMode={displayMode}
            metrics={metrics}
            deriveKeys={deriveKeys}
            lockKeys={lockKeys}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            handlePromote={handlePromote}
            handleSetAtPath={handleSetAtPath}
            fullData={data.Income}
            onImmediateChange={handleImmediateChange} // 👈 added
          />
          {showTotal && <SectionTotal data={data} title={title} />}
        </>
      )}
    </div>
  );
}
