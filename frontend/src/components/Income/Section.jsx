// components/Income/Section.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import LeafEditor from "./LeafEditor.jsx";
import BranchTotals from "./BranchTotals.jsx";
import { newLeaf } from "@/utils/income/incomeDefaults.js";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useDialog } from "@/app/providers/DialogProvider.jsx";
import ValueColumns from "./ValueColumns.jsx";
import SectionTotal from "@components/Income/SectionTotal.jsx";

import "@/styles/components/Income/Section.css";

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

/* -------------------------------------------------------------------------- */
/* ⚙️ Helpers                                                                 */
/* -------------------------------------------------------------------------- */
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
  "pUnitAnnual",
  "grossMonthly",
  "psfMonthly",
  "pUnitMonthly",
];

const isPO = (v) =>
  v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
const isLeafNode = (v) =>
  isPO(v) && LEAF_KEYS.some((k) => k in v && typeof v[k] !== "object");

const parentPath = (full) =>
  full.includes(".") ? full.split(".").slice(0, -1).join(".") : "";
const leafKey = (full) => full.split(".").pop();

const getRowClass = (depth) => (depth > 0 ? "sec__subRowGrid" : "sec__rowGrid");

/* -------------------------------------------------------------------------- */
/* 🔄 Sortable Row                                                            */
/* -------------------------------------------------------------------------- */
function SortableRow({ id, disabled, mainRow, childrenBelow }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      className={`sec__row ${isDragging ? "is-dragging" : ""} ${
        childrenBelow ? "has-children" : ""
      }`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-key={id}
    >
      <div className="sec__rowGrid">
        <span className="sec__firstCell">
          <button
            type="button"
            className={`sec__drag ${disabled ? "is-disabled" : ""}`}
            {...(!disabled ? { ...attributes, ...listeners } : {})}
            aria-label="Drag row"
            title={disabled ? "" : "Drag to reorder"}
          >
            ⋮⋮
          </button>
          {mainRow.leading}
        </span>

        <span className="sec__label" data-depth={0} style={{ "--depth": 0 }}>
          <span className="sec__indent" />
          <span className="sec__labelText">{mainRow.label}</span>
        </span>

        <div className="sec__values">{mainRow.values}</div>

        <div className="sec__actions">{mainRow.actions}</div>
      </div>

      {/* Children render directly below; no extra wrapper */}
      {childrenBelow}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🧩 Section Component                                                       */
/* -------------------------------------------------------------------------- */
export default function Section({
  title,
  data = {},
  onChange,
  showTotal = true,
  enableSort = false,
  lockKeys = new Set(),
  metrics = { gbaSqft: 0, units: 0 },
  deriveKeys = new Set(["Gross Scheduled Rent"]),
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

  /* ---------------------------------------------------------------------- */
  /* 🗂️ Ordering / state management                                         */
  /* ---------------------------------------------------------------------- */
  const topLevelKeys = useMemo(
    () =>
      Object.keys(data || {}).filter(
        (k) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k)
      ),
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

  const setAtPath = useCallback(
    (path, updater) => {
      const keys = path ? path.split(".") : [];
      const updated = structuredClone(data);
      let cur = updated;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] ||= {};
      if (keys.length) {
        const k = keys.at(-1);
        const nextVal = updater(cur[k]);
        cur[k] = nextVal;
        onChange(updated);
      }
    },
    [data, onChange]
  );

  /* ---------------------------------------------------------------------- */
  /* ➕ Add / Delete / Promote                                              */
  /* ---------------------------------------------------------------------- */
  const addItem = async (path = "") => {
    const raw = await prompt({
      title: "New line item",
      message: path ? `Parent: ${path}` : `Add to ${title ?? "Section"}`,
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

  /* ---------------------------------------------------------------------- */
  /* 🔽 Collapsing logic                                                    */
  /* ---------------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------------- */
  /* 🧱 Drag and Drop                                                      */
  /* ---------------------------------------------------------------------- */
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const aParent = parentPath(active.id);
    const bParent = parentPath(over.id);
    if (aParent !== bParent) return;

    if (aParent === "") {
      setOrder((prev) => {
        const from = prev.indexOf(active.id);
        const to = prev.indexOf(over.id);
        if (from === -1 || to === -1) return prev;
        return arrayMove(prev, from, to);
      });
      return;
    }

    setAtPath(aParent, (prev) => {
      if (!isPO(prev)) return prev;
      const keys = Object.keys(prev).filter(
        (k) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k)
      );
      const from = keys.indexOf(leafKey(active.id));
      const to = keys.indexOf(leafKey(over.id));
      if (from < 0 || to < 0) return prev;
      const reordered = {};
      arrayMove(keys, from, to).forEach((k) => (reordered[k] = prev[k]));
      return reordered;
    });
  };

  /* ---------------------------------------------------------------------- */
  /* 🌿 Child Renderers                                                    */
  /* ---------------------------------------------------------------------- */
  const ChildLeaf = ({ full, depth, label, val }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: full });

    return (
      <div
        ref={setNodeRef}
        className={`sec__row ${isDragging ? "is-dragging" : ""}`}
        style={{ transform: CSS.Transform.toString(transform), transition }}
      >
        <div className={getRowClass(depth)} data-depth={depth}>
          <span className="sec__firstCell">
            <button className="sec__drag" {...attributes} {...listeners}>
              ⋮⋮
            </button>
          </span>

          <span className="sec__label" data-depth={depth}>
            <span className="sec__labelText">{label}</span>
          </span>

          <div className="sec__values">
            <LeafEditor
              fullPath={full}
              val={val}
              setAtPath={setAtPath}
              displayMode={displayMode}
              metrics={metrics}
              deriveFromMetrics={true}
            />
          </div>

          <div className="sec__actions">
            <button
              className="sub-btn"
              onClick={async () => await promoteToObject(full)}
            >
              + Sub
            </button>
            <button
              className="danger-btn"
              onClick={async () => await deleteAtPath(full)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ChildBranch = ({ full, depth, label, val }) => {
    const collapsed = isCollapsed(full);
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: full });

    return (
      <div
        ref={setNodeRef}
        className={`sec__row ${isDragging ? "is-dragging" : ""} ${
          !collapsed ? "has-children" : ""
        }`}
        style={{ transform: CSS.Transform.toString(transform), transition }}
      >
        <div className={getRowClass(depth)} data-depth={depth}>
          <span className="sec__firstCell">
            <button className="sec__drag" {...attributes} {...listeners}>
              ⋮⋮
            </button>
            <button className="sec__caret" onClick={() => togglePath(full)}>
              {collapsed ? "▸" : "▾"}
            </button>
          </span>

          <span className="sec__label" data-depth={depth}>
            <span className="sec__labelText">{label}</span>
          </span>

          <div className="sec__values">
            <BranchTotals value={val} displayMode={displayMode} />
          </div>

          <div className="sec__actions">
            <button
              className="sub-btn"
              onClick={async () => await addItem(full)}
            >
              + Sub
            </button>
            <button
              className="danger-btn"
              onClick={async () => await deleteAtPath(full)}
            >
              Delete
            </button>
          </div>
        </div>

        {!collapsed && renderChildren(val, full, depth + 1)}
      </div>
    );
  };

  const renderChildren = (obj, path, depth) => {
    if (!isPO(obj)) return null;
    const entries = Object.entries(obj).filter(
      ([k]) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k)
    );
    const items = entries.map(([k]) => (path ? `${path}.${k}` : k));

    return (
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {entries.map(([key, val]) => {
          const full = path ? `${path}.${key}` : key;
          return isLeafNode(val) ? (
            <ChildLeaf
              key={full}
              full={full}
              depth={depth}
              label={key}
              val={val}
            />
          ) : (
            <ChildBranch
              key={full}
              full={full}
              depth={depth}
              label={key}
              val={val}
            />
          );
        })}
      </SortableContext>
    );
  };

  /* ---------------------------------------------------------------------- */
  /* 🧱 Top-level Render                                                   */
  /* ---------------------------------------------------------------------- */
  const renderTopLevel = () => (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
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
              <LeafEditor
                fullPath={key}
                val={val}
                setAtPath={setAtPath}
                displayMode={displayMode}
                metrics={metrics}
                deriveFromMetrics={deriveKeys.has(key)}
              />
            ) : (
              <BranchTotals value={val} displayMode={displayMode} />
            ),
            actions: (
              <>
                <button
                  className="sub-btn"
                  onClick={async () =>
                    await (isLeafTop ? promoteToObject(key) : addItem(key))
                  }
                >
                  + Sub
                </button>
                <button
                  className="danger-btn"
                  onClick={async () => await deleteAtPath(key)}
                >
                  Delete
                </button>
              </>
            ),
          };

          const childrenBelow =
            !isLeafTop && !collapsedTop ? renderChildren(val, key, 1) : null;

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

  /* ---------------------------------------------------------------------- */
  /* 🖼️ Render                                                             */
  /* ---------------------------------------------------------------------- */
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
            </div>
          </div>
        </div>
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
