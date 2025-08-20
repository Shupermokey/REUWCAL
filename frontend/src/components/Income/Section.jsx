import React, { useState } from "react";
import LeafEditor from "./LeafEditor.jsx";
import BranchTotals from "./BranchTotals.jsx";
import { isLeaf } from "../../utils/incomeMath.js";
import { newLeaf } from "../../utils/incomeDefaults.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";
import { useDialog } from "../../app/DialogProvider";

export default function Section({ title, data = {}, onChange }) {
  const { groupedView, viewMode } = useIncomeView();
  const { prompt, confirm } = useDialog();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());

  const setAtPath = (path, updater) => {
    const keys = path.split(".");
    const updated = structuredClone(data);
    let cur = updated;
    for (let i = 0; i < keys.length - 1; i++) cur = (cur[keys[i]] ||= {});
    const k = keys.at(-1);
    cur[k] = updater(cur[k]);
    onChange(updated);
  };

  const addItem = async (path = "") => {
    const raw = await prompt({ title: "New line item", message: path ? `Parent: ${path}` : `Add to ${title}`, placeholder: "e.g., Landscaping" });
    if (raw == null) return;
    const label = String(raw).trim().replace(/[~*/\[\]]/g," ").replace(/\s+/g," ").slice(0,80) || "Item";
    const updated = structuredClone(data);
    let cur = updated;
    if (path) path.split(".").forEach((k) => (cur = cur[k] ||= {}));
    let key = label, i = 2; while (Object.prototype.hasOwnProperty.call(cur, key)) key = `${label} ${i++}`;
    cur[key] = newLeaf();
    onChange(updated);
  };

  const promoteToObject = async (path) => {
    const raw = await prompt({ title: "Add a sub-item", message: `Parent: ${path}`, placeholder: "e.g., Landscaping" });
    if (raw == null) return;
    const label = String(raw).trim().replace(/[~*/\[\]]/g," ").replace(/\s+/g," ").slice(0,80) || "Subitem";
    setAtPath(path, (prev) => {
      const leaf = isLeaf(prev) ? prev : newLeaf();
      const branch = { Default: leaf };
      let k = label, i = 2; while (Object.prototype.hasOwnProperty.call(branch, k)) k = `${label} ${i++}`;
      branch[k] = newLeaf();
      return branch;
    });
  };

  const deleteAtPath = async (path) => {
    if (!path) return;
    const ok = await confirm({ title: "Delete this item?", message: `This will remove "${path}" and its sub-items.` });
    if (!ok) return;
    const keys = path.split(".");
    const updated = structuredClone(data);
    let cur = updated; for (let i=0;i<keys.length-1;i++) cur = cur[keys[i]];
    delete cur[keys.at(-1)];
    onChange(updated);
  };

  const canUngroup = (node) => {
    if (!node || typeof node !== "object" || isLeaf(node)) return false;
    const entries = Object.entries(node);
    if (entries.length !== 1) return false;
    return isLeaf(entries[0][1]);
  };
  const ungroupAtPath = (path) => setAtPath(path, (prev) => canUngroup(prev) ? { ...Object.values(prev)[0] } : prev);

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
      for (const [k, v] of Object.entries(obj || {})) {
        const path = p ? `${p}.${k}` : k;
        if (!isLeaf(v) && typeof v === "object") { all.add(path); walk(v, path); }
      }
    };
    walk(data); setCollapsedPaths(all);
  };
  const expandAll = () => setCollapsedPaths(new Set());

  const render = (obj, path = "", depth = 0) =>
    Object.entries(obj).map(([key, val]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const indent = { marginLeft: `${depth * 20}px` };

      if (isLeaf(val)) {
        return (
          <div key={fullPath} className="nested-line-item" style={indent}>
            <div className="line-item">
              <span className="caret-spacer" />
              <span className="line-label">{key}</span>
              <LeafEditor fullPath={fullPath} val={val} setAtPath={setAtPath} groupedView={groupedView} />
              <button className="sub-btn" onClick={async () => await promoteToObject(fullPath)}>+ Sub</button>
              <button className="danger-btn" onClick={async () => await deleteAtPath(fullPath)}>🗑 Delete</button>
            </div>
          </div>
        );
      }

      const collapsed = isCollapsed(fullPath);
      return (
        <div key={fullPath} className="nested-line-item" style={indent}>
          <div className="line-item">
            <button className="caret-btn" onClick={() => togglePath(fullPath)}>{collapsed ? "▸" : "▾"}</button>
            <span className="line-label">{key}</span>
            <BranchTotals value={val} groupedView={groupedView} />
            <div className="row-actions">
              <button className="sub-btn" onClick={async () => await addItem(fullPath)}>+ Sub</button>
              {canUngroup(val) && (
                <button className="sub-btn" onClick={() => ungroupAtPath(fullPath)} title="Replace this group with its only child">↧ Ungroup</button>
              )}
              <button className="danger-btn" onClick={async () => await deleteAtPath(fullPath)}>🗑 Delete</button>
            </div>
          </div>
          {!collapsed && render(val || {}, fullPath, depth + 1)}
        </div>
      );
    });

  return (
    <div className="statement-section">
      <h4 onClick={() => setCollapsed((c) => !c)}>
        <span>{collapsed ? "▸" : "▾"} {title} {groupedView ? `• ${viewMode}` : ""}</span>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="add-btn" onClick={async (e) => { e.stopPropagation(); await addItem(); }}>+ Item</button>
          <button className="add-btn" onClick={(e) => { e.stopPropagation(); collapseAll(); }}>Collapse All</button>
          <button className="add-btn" onClick={(e) => { e.stopPropagation(); expandAll(); }}>Expand All</button>
        </span>
      </h4>
      {!collapsed && render(data)}
    </div>
  );
}
