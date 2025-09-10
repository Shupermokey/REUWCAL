// Section.jsx
// ⛔️ Remove: import { isLeaf } from "../../utils/incomeMath.js";
import React, { useState } from "react";
import LeafEditor from "./LeafEditor.jsx";
import BranchTotals from "./BranchTotals.jsx";
import { newLeaf } from "../../utils/incomeDefaults.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";
import { useDialog } from "../../app/DialogProvider";
import ViewToggle from "./ViewToggle.jsx";
import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "./SectionTotal.jsx";

const LEAF_KEYS = [
  "grossAnnual",
  "psfAnnual",
  "punitAnnual",
  "rateAnnual",
  "grossMonthly",
  "psfMonthly",
  "punitMonthly",
  "rateMonthly",
];

export const LEGACY_LEAF_KEYS = [
  "grossAnnual",
  "psfAnnual",
  "pUnitAnnual", // 👈 legacy casing
  "grossMonthly",
  "psfMonthly",
  "pUnitMonthly", // 👈 legacy casing
];

const isPlainObject = (v) =>
  v != null &&
  typeof v === "object" &&
  Object.getPrototypeOf(v) === Object.prototype;

const isLeafNode = (v) => {
  if (!isPlainObject(v)) return false;
  // it's a leaf if it has any of the leaf fields (values needn't be numbers yet)
  return LEAF_KEYS.some((k) => k in v && typeof v[k] !== "object");
};

export default function Section({ title, data = {}, onChange }) {
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

  const setAtPath = (path, updater) => {
    const keys = path.split(".");
    const updated = structuredClone(data);
    let cur = updated;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] ||= {};
    const k = keys.at(-1);
    cur[k] = updater(cur[k]);
    onChange(updated);
  };

  const addItem = async (path = "") => {
    const raw = await prompt({
      title: "New line item",
      message: path ? `Parent: ${path}` : `Add to ${title}`,
      placeholder: "e.g., Landscaping",
    });
    if (raw == null) return;
    const label =
      String(raw)
        .trim()
        .replace(/[~*/\[\]]/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 80) || "Item";
    const updated = structuredClone(data);
    let cur = updated;
    if (path) path.split(".").forEach((k) => (cur = cur[k] ||= {}));
    let key = label,
      i = 2;
    while (Object.prototype.hasOwnProperty.call(cur, key))
      key = `${label} ${i++}`;
    cur[key] = newLeaf();
    onChange(updated);
  };

  const promoteToObject = async (path) => {
    const raw = await prompt({
      title: "Add a sub-item",
      message: `Parent: ${path}`,
      placeholder: "e.g., Landscaping",
    });
    if (raw == null) return;
    const label =
      String(raw)
        .trim()
        .replace(/[~*/\[\]]/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 80) || "Subitem";
    setAtPath(path, (prev) => {
      const leaf = isLeafNode(prev) ? prev : newLeaf();
      const branch = {};
      let k = label,
        i = 2;
      while (Object.prototype.hasOwnProperty.call(branch, k))
        k = `${label} ${i++}`;
      branch[k] = { ...leaf };
      return branch;
    });
  };

  const deleteAtPath = async (path) => {
    if (!path) return;
    const ok = await confirm({
      title: "Delete this item?",
      message: `This will remove "${path}" and its sub-items.`,
    });
    if (!ok) return;
    const keys = path.split(".");
    const updated = structuredClone(data);
    let cur = updated;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    delete cur[keys.at(-1)];
    onChange(updated);
  };

  const isCollapsed = (path) => collapsedPaths.has(path);
  const togglePath = (path) =>
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });

  const collapseAll = () => {
    const all = new Set();
    const walk = (obj, p = "") => {
      if (!isPlainObject(obj)) return;
      for (const [k, v] of Object.entries(obj)) {
        const path = p ? `${p}.${k}` : k;
        if (isPlainObject(v) && !isLeafNode(v)) {
          all.add(path);
          walk(v, path);
        }
      }
    };
    walk(data);
    setCollapsedPaths(all);
  };
  const expandAll = () => setCollapsedPaths(new Set());

  // ✅ SAFE RECURSIVE RENDERER
  const MAX_DEPTH = 64;
  const render = (obj, path = "", depth = 0) => {
    if (depth > 64) return null;
    if (!isPlainObject(obj)) return null;

    const entries = Object.entries(obj).filter(
      ([k]) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k)
    );

    return entries.map(([key, val]) => {
      const fullPath = path ? `${path}.${key}` : key;

      if (isLeafNode(val)) {
        return (
          <div className="line-item section-row" key={fullPath}>
            <span className="caret-spacer" />
            <span
              className="line-label"
              data-depth={depth}
              style={{ "--depth": depth }}
            >
              <span className="indent-spacer" />
              <span className="label-text">{key}</span>
            </span>
            <div className="value-grid">
              <LeafEditor
                fullPath={fullPath}
                val={val}
                setAtPath={setAtPath}
                displayMode={displayMode}
              />
            </div>
            <div className="row-actions">
              <button
                className="sub-btn"
                onClick={async () => await promoteToObject(fullPath)}
              >
                + Sub
              </button>
              <button
                className="danger-btn"
                onClick={async () => await deleteAtPath(fullPath)}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        );
      }

      const collapsed = isCollapsed(fullPath);
      return (
        <React.Fragment key={fullPath}>
          <div className="line-item section-row" key={fullPath}>
            <button className="caret-btn" onClick={() => togglePath(fullPath)}>
              {collapsed ? "▸" : "▾"}
            </button>
            <span
              className="line-label"
              data-depth={depth}
              style={{ "--depth": depth }}
            >
              <span className="indent-spacer" />
              <span className="label-text">{key}</span>
            </span>
            <div className="value-grid">
              <BranchTotals value={val} displayMode={displayMode} />
            </div>
            <div className="row-actions">
              <button
                className="sub-btn"
                onClick={async () => await addItem(fullPath)}
              >
                + Sub
              </button>
              <button
                className="danger-btn"
                onClick={async () => await deleteAtPath(fullPath)}
              >
                🗑 Delete
              </button>
            </div>
          </div>
          {!collapsed && render(val, fullPath, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`statement-section section-grid ${modeClass}`}>
      {/* Section header row (click to collapse) */}
      <h4 className="section-row" onClick={() => setCollapsed((c) => !c)}>
        <span>{collapsed ? "▸" : "▾"}</span>
        <span>{title}</span>

        {/* Column headers in the value columns */}
        <div className="value-grid">
          <ValueColumns />
        </div>

        <span style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            className="add-btn"
            onClick={async (e) => {
              e.stopPropagation();
              await addItem();
            }}
          >
            + Item
          </button>
          <button
            className="add-btn"
            onClick={(e) => {
              e.stopPropagation();
              collapseAll();
            }}
          >
            Collapse All
          </button>
          <button
            className="add-btn"
            onClick={(e) => {
              e.stopPropagation();
              expandAll();
            }}
          >
            Expand All
          </button>
        </span>
      </h4>

      {!collapsed && (
        <>
          {render(data)}
          {/* Section total row */}
          <SectionTotal data={data} title={title} />
        </>
      )}
    </div>
  );
}
