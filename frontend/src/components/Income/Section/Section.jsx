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
  data,
  onChange,
  metrics = { gbaSqft: 0, units: 0 },
  onAutoSave,
  sectionTitle,
  fullData,
}) {
  const { displayMode } = useIncomeView();
  const { prompt, confirm } = useDialog();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());

  const modeClass =
    displayMode === "both"
      ? "mode-both"
      : displayMode === "monthly"
      ? "mode-monthly"
      : "mode-annual";

  // --- Action handlers -------------------------------------------------------
  const handleAdd = async (path = "") => {
    const updated = await addItem({ path, title, data, onChange, prompt });
    if (updated && onAutoSave && fullData) {
      const merged = { ...fullData, [sectionTitle]: updated };
      await onAutoSave(merged);
    }
  };

  const handleDelete = async (path) => {
    const updated = await deleteAtPath({ path, data, onChange, confirm });
    if (updated && onAutoSave && fullData) {
      const merged = { ...fullData, [sectionTitle]: updated };
      await onAutoSave(merged);
    }
  };

  const handlePromote = async (path) =>
    await promoteToObject({ path, data, onChange, prompt });

  const handleSetAtPath = useCallback(
    (path, updater) => {
      // 🩹 FIX: wrap section data under its root key
      const sectionKey = sectionTitle || path.split(".")[0];
      const wrappedData = { [sectionKey]: data };

      setAtPath({
        path: path,
        data: wrappedData,
        onChange: (newData) => {
          // unwrap before passing back to section’s onChange
          onChange(newData[sectionKey]);
        },
        updater,
      });
    },
    [data, onChange]
  );

  const handleCollapseAll = () => collapseAll(data, setCollapsedPaths);
  const handleExpandAll = () => expandAll(setCollapsedPaths);

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
              <span className="sec__labelText">{title}</span>{" "}
              {/*Operating Income | Operating Expenses | Capital Expenses */}
            </div>

            <div className="sec__values">
              <ValueColumns />
            </div>

            <div className="sec__actions sec__headerActions">
              <button className="add-btn" onClick={() => handleAdd()}>
                + Item
              </button>
              {/* <button className="add-btn" onClick={handleCollapseAll}>
                Collapse All
              </button>
              <button className="add-btn" onClick={handleExpandAll}>
                Expand All
              </button> */}
            </div>
          </div>
        </div>
      )}

      {(!hasHeader || !collapsed) && (
        <>
          <ChildBranch
            sectionTitle={sectionTitle}
            depth={0}
            val={data}
            collapsedPaths={collapsedPaths}
            displayMode={displayMode}
            metrics={metrics}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            handlePromote={handlePromote}
            handleSetAtPath={handleSetAtPath}
          />
          <SectionTotal data={data} title={title} />
        </>
      )}
    </div>
  );
}
