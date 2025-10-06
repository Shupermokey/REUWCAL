// components/Income/Section.jsx
import React, { useEffect, useMemo, useState } from "react";
import LeafEditor from "./LeafEditor.jsx";
import BranchTotals from "./BranchTotals.jsx";
import { newLeaf } from "../../utils/income/incomeDefaults.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";
import { useDialog } from "../../app/DialogProvider";
import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "./SectionTotal.jsx";

// NEW: split, namespaced styles
import "../../styles/Section/base.css"
import "../../styles/Section/row.css"
import "../../styles/Section/responsive.css"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

/* ---------------- helpers ---------------- */
const LEAF_KEYS = [
  "grossAnnual","psfAnnual","punitAnnual","rateAnnual",
  "grossMonthly","psfMonthly","punitMonthly","rateMonthly",
];

export const LEGACY_LEAF_KEYS = [
  "grossAnnual","psfAnnual","pUnitAnnual",
  "grossMonthly","psfMonthly","pUnitMonthly",
];

const isPO = (v) => v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
const isLeafNode = (v) => isPO(v) && LEAF_KEYS.some((k) => k in v && typeof v[k] !== "object");

/* ---------------- Sortable item (top-level row + its subtree) --------------- */
function SortableRow({ id, disabled, mainRow, childrenBelow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      className={`sec__row ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-key={id}
    >
      <div className="sec__rowGrid">
        <span className="sec__firstCell">
          {mainRow.leading}
          <button
            type="button"
            className={`sec__drag ${disabled ? "is-disabled" : ""}`}
            {...(!disabled ? { ...attributes, ...listeners } : {})}
            aria-label="Drag row"
            title={disabled ? "" : "Drag to reorder"}
          >
            ⋮⋮
          </button>
        </span>

        <span className="sec__label" data-depth={0} style={{ "--depth": 0 }}>
          <span className="sec__indent" />
          <span className="sec__labelText">{mainRow.label}</span>
        </span>

        <div className="sec__values">{mainRow.values}</div>
        <div className="sec__actions">{mainRow.actions}</div>
      </div>

      {childrenBelow ? <div className="sec__childSpanner">{childrenBelow}</div> : null}
    </div>
  );
}

/* ---------------- component ---------------- */
export default function Section({
  title,
  data = {},
  onChange,
  showTotal = true,
  enableSort = false,
  lockKeys = new Set(),
}) {
  const { displayMode } = useIncomeView();
  const { prompt, confirm } = useDialog();

  const [collapsed, setCollapsed] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const modeClass =
    displayMode === "both" ? "mode-both" :
    displayMode === "monthly" ? "mode-monthly" : "mode-annual";

  /* -------- top-level ordering -------- */
  const topLevelKeys = useMemo(
    () => Object.keys(data || {}).filter((k) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k)),
    [data]
  );
  const [order, setOrder] = useState(topLevelKeys);
  useEffect(() => {
    setOrder((prev) => {
      const keep = prev.filter((k) => topLevelKeys.includes(k));
      const add = topLevelKeys.filter((k) => !keep.includes(k));
      return [...keep, ...add];
    });
  }, [topLevelKeys]);

  /* ---------------- mutations ---------------- */
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
    const raw = await prompt({ title: "New line item", message: path ? `Parent: ${path}` : `Add to ${title ?? "Section"}`, placeholder: "e.g., Landscaping" });
    if (raw == null) return;
    const label = String(raw).trim().replace(/[~*/\[\]]/g, " ").replace(/\s+/g, " ").slice(0, 80) || "Item";
    const updated = structuredClone(data);
    let cur = updated;
    if (path) path.split(".").forEach((k) => (cur = (cur[k] ||= {})));
    let key = label, i = 2;
    while (Object.prototype.hasOwnProperty.call(cur, key)) key = `${label} ${i++}`;
    cur[key] = newLeaf();
    onChange(updated);
  };

  const promoteToObject = async (path) => {
    const raw = await prompt({ title: "Add a sub-item", message: `Parent: ${path}`, placeholder: "e.g., Landscaping" });
    if (raw == null) return;
    const label = String(raw).trim().replace(/[~*/\[\]]/g, " ").replace(/\s+/g, " ").slice(0, 80) || "Subitem";
    setAtPath(path, (prev) => {
      const leaf = isLeafNode(prev) ? prev : newLeaf();
      const branch = {};
      let k = label, i = 2;
      while (Object.prototype.hasOwnProperty.call(branch, k)) k = `${label} ${i++}`;
      branch[k] = { ...leaf };
      return branch;
    });
  };

  const deleteAtPath = async (path) => {
    const ok = await confirm({ title: "Delete this item?", message: `This will remove "${path}" and its sub-items.` });
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
      if (!isPO(obj)) return;
      for (const [k, v] of Object.entries(obj)) {
        const path = p ? `${p}.${k}` : k;
        if (isPO(v) && !isLeafNode(v)) {
          all.add(path);
          walk(v, path);
        }
      }
    };
    walk(data);
    setCollapsedPaths(all);
  };
  const expandAll = () => setCollapsedPaths(new Set());

  /* ---------------- child renderers ---------------- */
  const ChildLeaf = ({ path, depth, label, val }) => (
    <div className="sec__childRow" data-depth={depth}>
      <span className="sec__firstCell" />
      <span className="sec__label" data-depth={depth} style={{ "--depth": depth }}>
        <span className="sec__indent" />
        <span className="sec__labelText">{label}</span>
      </span>
      <div className="sec__values">
        <LeafEditor fullPath={path} val={val} setAtPath={setAtPath} displayMode={displayMode} />
      </div>
      <div className="sec__actions">
        <button className="sub-btn" onClick={async () => await promoteToObject(path)}>+ Sub</button>
        <button className="danger-btn" onClick={async () => await deleteAtPath(path)}>Delete</button>
      </div>
    </div>
  );

  const ChildBranch = ({ path, depth, label, val }) => {
    const collapsed = isCollapsed(path);
    return (
      <>
        <div className="sec__childRow" data-depth={depth}>
          <span className="sec__firstCell">
            <button className="sec__caret" onClick={() => togglePath(path)}>
              {collapsed ? "▸" : "▾"}
            </button>
          </span>
          <span className="sec__label" data-depth={depth} style={{ "--depth": depth }}>
            <span className="sec__indent" />
            <span className="sec__labelText">{label}</span>
          </span>
          <div className="sec__values">
            <BranchTotals value={val} displayMode={displayMode} />
          </div>
          <div className="sec__actions">
            <button className="sub-btn" onClick={async () => await addItem(path)}>+ Sub</button>
            <button className="danger-btn" onClick={async () => await deleteAtPath(path)}>Delete</button>
          </div>
        </div>
        {!collapsed && renderChildren(val, path, depth + 1)}
      </>
    );
  };

  const renderChildren = (obj, path, depth) => {
    if (!isPO(obj)) return null;
    const entries = Object.entries(obj).filter(([k]) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k));
    return entries.map(([key, val]) => {
      const full = path ? `${path}.${key}` : key;
      return isLeafNode(val)
        ? <ChildLeaf key={full} path={full} depth={depth} label={key} val={val} />
        : <ChildBranch key={full} path={full} depth={depth} label={key} val={val} />;
    });
  };

  /* ------------- top-level render (sortable; children INSIDE each item) ------ */
  const renderTopLevel = () => (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        setOrder((prev) => {
          const from = prev.indexOf(active.id);
          const to = prev.indexOf(over.id);
          if (from === -1 || to === -1) return prev;
          return arrayMove(prev, from, to);
        });
      }}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {order.map((key) => {
          const val = data[key];
          const locked = lockKeys?.has?.(key) ?? false;
          const isLeafTop = isLeafNode(val);
          const collapsedTop = !isLeafTop && collapsedPaths.has(key);

          const mainRow = {
            leading: !isLeafTop ? (
              <button className="sec__caret" onClick={() => togglePath(key)}>
                {collapsedTop ? "▸" : "▾"}
              </button>
            ) : null,
            label: key,
            values: isLeafTop ? (
              <LeafEditor fullPath={key} val={val} setAtPath={setAtPath} displayMode={displayMode} />
            ) : (
              <BranchTotals value={val} displayMode={displayMode} />
            ),
            actions: isLeafTop ? (
              <>
                <button className="sub-btn" onClick={async () => await promoteToObject(key)}>+ Sub</button>
                <button className="danger-btn" onClick={async () => await deleteAtPath(key)}>Delete</button>
              </>
            ) : (
              <>
                <button className="sub-btn" onClick={async () => await addItem(key)}>+ Sub</button>
                <button className="danger-btn" onClick={async () => await deleteAtPath(key)}>Delete</button>
              </>
            ),
          };

          const childrenBelow = !isLeafTop && !collapsedTop ? renderChildren(val, key, 1) : null;

          return (
            <SortableRow
              key={key}
              id={key}
              disabled={locked}
              mainRow={mainRow}
              childrenBelow={childrenBelow}
            />
          );
        })}
      </SortableContext>
    </DndContext>
  );

  const hasHeader = !!title;

  return (
    <div className={`sec ${modeClass}`}>
      {hasHeader && (
        <h4 className="sec__header" onClick={() => setCollapsed((c) => !c)}>
          <span>{collapsed ? "▸" : "▾"}</span>
          <span>{title}</span>
          <div className="sec__values"><ValueColumns /></div>
          <span style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="add-btn" onClick={async (e) => { e.stopPropagation(); await addItem(); }}>+ Item</button>
            <button className="add-btn" onClick={(e) => { e.stopPropagation(); collapseAll(); }}>Collapse All</button>
            <button className="add-btn" onClick={(e) => { e.stopPropagation(); expandAll(); }}>Expand All</button>
          </span>
        </h4>
      )}

      {(!hasHeader || !collapsed) && (
        <>
          {renderTopLevel()}
          {showTotal && <SectionTotal data={data} title={title} />}
        </>
      )}
    </div>
  );
}
