import React, { useState, useEffect } from "react";
import { useAuth } from "../app/AuthProvider";
import toast from "react-hot-toast";
import "../styles/PropertyIncomeStatement.css";
import {
  getIncomeStatement,
  saveIncomeStatement,
} from "../services/firestoreService";
import jsPDF from "jspdf";
import { useDialog } from "../app/DialogProvider";

/** ========== Schema & helpers ========== */
const LEAF_KEYS = [
  "grossAnnual",
  "psfAnnual",
  "pUnitAnnual",
  "grossMonthly",
  "psfMonthly",
  "pUnitMonthly",
];

const DEBUG = true;
const log = (...a) => DEBUG && console.debug("[IncomeStmt]", ...a);

const SECTION_KEYS = [
  "Income",
  "Vacancy",
  "OperatingExpenses",
  "CapitalExpenses",
];

// Deep merge maps; leaves replace, branches recurse
const deepMerge = (base, incoming) => {
  if (!incoming) return structuredClone(base);
  if (isLeaf(incoming)) return { ...incoming };
  const out = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    const bv = base?.[k];
    out[k] =
      bv &&
      typeof bv === "object" &&
      !isLeaf(bv) &&
      typeof v === "object" &&
      !isLeaf(v)
        ? deepMerge(bv, v)
        : isLeaf(v)
        ? { ...v }
        : { ...(v || {}) };
  }
  return out;
};

const hasAnyLeafKeys = (o) => LEAF_KEYS.some((k) => k in (o || {}));
const pickLeaf = (o) => {
  const out = {};
  LEAF_KEYS.forEach((k) => (out[k] = Number(o?.[k] || 0)));
  return out;
};

function migrateMixedNodes(node, path = "") {
  if (!node || typeof node !== "object" || isLeaf(node)) return node;

  const keys = Object.keys(node);
  const hasLeaf = hasAnyLeafKeys(node);
  const hasChildren = keys.some(
    (k) => !LEAF_KEYS.includes(k) && typeof node[k] === "object"
  );

  // Mixed: has leaf fields + at least one child → wrap leaf in Default
  if (hasLeaf && hasChildren) {
    const leaf = pickLeaf(node);
    // remove leaf keys from parent
    LEAF_KEYS.forEach((k) => {
      delete node[k];
    });
    if (!node.Default) node.Default = leaf;
    console.debug(
      "[IncomeStmt] migrateMixedNodes → wrapped leaf into 'Default' at",
      path || "<root>"
    );
  }

  // Recurse into children
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "object")
      node[k] = migrateMixedNodes(v, path ? `${path}.${k}` : k);
  }
  return node;
}

const newLeaf = () => ({
  grossAnnual: 0,
  psfAnnual: 0,
  pUnitAnnual: 0,
  grossMonthly: 0,
  psfMonthly: 0,
  pUnitMonthly: 0,
});

const isLeaf = (v) => {
  if (!v || typeof v !== "object") return false;
  const keys = Object.keys(v);
  if (keys.length !== LEAF_KEYS.length) return false;
  return LEAF_KEYS.every((k) => typeof v[k] === "number");
};

/** ---- recursive subtotal helpers ---- */
const ZERO = {
  grossAnnual: 0,
  psfAnnual: 0,
  pUnitAnnual: 0,
  grossMonthly: 0,
  psfMonthly: 0,
  pUnitMonthly: 0,
};
const cloneZero = () => ({ ...ZERO });

/** Recursively sum a node (branch or leaf) into a leaf‑shaped totals object */
function sumNode(node) {
  if (!node) return cloneZero();
  if (isLeaf(node)) return { ...node };

  const totals = cloneZero();
  for (const child of Object.values(node)) {
    const t = sumNode(child);
    totals.grossAnnual += t.grossAnnual || 0;
    totals.psfAnnual += t.psfAnnual || 0;
    totals.pUnitAnnual += t.pUnitAnnual || 0;
    totals.grossMonthly += t.grossMonthly || 0;
    totals.psfMonthly += t.psfMonthly || 0;
    totals.pUnitMonthly += t.pUnitMonthly || 0;
  }
  return totals;
}

/** ---- default tree ---- */
const defaultStructure = {
  Income: {
    BRI: newLeaf(),
    RECI: newLeaf(),
    "Other Income": newLeaf(),
  },
  Vacancy: {
    "Vacancy Loss": newLeaf(),
  },
  OperatingExpenses: {
    "Property Tax": { "Base Tax": newLeaf() },
    Insurance: newLeaf(),
    "CAM Utilities": newLeaf(),
    "CAM Repairs": {
      Labor: newLeaf(),
      Material: newLeaf(),
      Other: newLeaf(),
    },
    Management: newLeaf(),
    Other: newLeaf(),
  },
  CapitalExpenses: {
    "Financing Expense": newLeaf(),
    "Capital Expenses": newLeaf(),
    "Capital Reserve": newLeaf(),
    Other: newLeaf(),
  },
};

function DebugTree({ title, obj }) {
  const walk = (o, p = "", rows = []) => {
    if (!o || typeof o !== "object") return rows;
    for (const [k, v] of Object.entries(o)) {
      const path = p ? `${p}.${k}` : k;
      const kind = isLeaf(v)
        ? "leaf"
        : typeof v === "object"
        ? "branch"
        : typeof v;
      rows.push({ path, kind });
      if (kind === "branch") walk(v, path, rows);
    }
    return rows;
  };
  const rows = walk(obj);
  return (
    <details style={{ margin: "12px 0" }}>
      <summary style={{ cursor: "pointer" }}>
        🔎 {title} ({rows.length} nodes)
      </summary>
      <pre
        style={{
          maxHeight: 220,
          overflow: "auto",
          background: "#fafafa",
          padding: 8,
        }}
      >
        {rows.map((r) => `${r.kind.padEnd(7)} ${r.path}`).join("\n")}
      </pre>
    </details>
  );
}

export default function PropertyIncomeStatement({ rowData, propertyId }) {
  const { user } = useAuth();
  const [data, setData] = useState(defaultStructure);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [viewMode, setViewMode] = useState("annual"); // 'annual' | 'monthly'

  // UI: grouped vs compact (two groups vs one flat row)
  const [groupedView, setGroupedView] = useState(true);

  const [loaded, setLoaded] = useState(false);

  /** Flatten rows -> for CSV/PDF */
  const flatten = (obj, parentKey = "") => {
    const acc = [];
    for (const [k, v] of Object.entries(obj || {})) {
      const path = parentKey ? `${parentKey}.${k}` : k;
      if (isLeaf(v)) {
        acc.push([
          path,
          v.grossAnnual,
          v.psfAnnual,
          v.pUnitAnnual,
          v.grossMonthly,
          v.psfMonthly,
          v.pUnitMonthly,
        ]);
      } else if (typeof v === "object") {
        acc.push(...flatten(v, path));
      }
    }
    return acc;
  };

  const handleExportCSV = () => {
    const rows = [
      [
        "Line Item",
        "Gross Annual",
        "PSF (Annual)",
        "PUnit (Annual)",
        "Gross Monthly",
        "PSF (Monthly)",
        "PUnit (Monthly)",
      ],
      ...flatten(data),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.setAttribute("download", `IncomeStatement_${propertyId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("📊 Income Statement", 14, 20);
    doc.setFontSize(10);

    let y = 30;
    doc.text("Line Item", 14, y);
    doc.text("Gross Ann", 85, y);
    doc.text("PSF Ann", 110, y);
    doc.text("PUnit Ann", 135, y);
    doc.text("Gross Mo", 160, y);
    doc.text("PSF Mo", 185, y);
    doc.text("PUnit Mo", 205, y, { align: "right" });
    y += 6;

    for (const [path, ga, psa, pua, gm, psm, pum] of flatten(data)) {
      doc.text(String(path), 14, y, { maxWidth: 65 });
      doc.text(String(ga), 85, y);
      doc.text(String(psa), 110, y);
      doc.text(String(pua), 135, y);
      doc.text(String(gm), 160, y);
      doc.text(String(psm), 185, y);
      doc.text(String(pum), 205, y, { align: "right" });
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    doc.save(`IncomeStatement_${propertyId}.pdf`);
  };

  useEffect(() => {
    if (!user || !propertyId) return;
    (async () => {
      const saved = await getIncomeStatement(user.uid, propertyId);
      const cleaned = migrateMixedNodes(
        structuredClone(saved || defaultStructure)
      );
      setData(cleaned ?? defaultStructure);
      setLoaded(true); // <-- missing!
      console.debug(
        "[IncomeStmt] AFTER MIGRATE — Income keys:",
        Object.keys(cleaned?.Income || {})
      );
    })();
  }, [user, propertyId]);

  useEffect(() => {
    if (!loaded) return;
    if (rowData && typeof rowData.bri === "number") {
      setData((prev) => {
        const next = structuredClone(prev);
        if (!next.Income) next.Income = {};
        if (!isLeaf(next.Income.BRI)) next.Income.BRI = newLeaf();
        next.Income.BRI.grossAnnual = rowData.bri;
        return next;
      });
    }
  }, [rowData, loaded]);

  const handleSave = async () => {
    if (!user || !propertyId) return;

    try {
      setSaving(true);
      setSaveError(null);

      // 🔴 nothing about the data path changed:
      await saveIncomeStatement(user.uid, propertyId, data);

      toast.success("✅ Saved Income Statement"); // your existing toast
      setLastSavedAt(new Date());
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      console.error("[IncomeStmt] save error:", e);
      setSaveError(e?.message || "Save failed");
      toast.error("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /** Section totals (sum all six columns; finance math uses grossAnnual) */
  const sumSectionColumns = (sectionObj) => {
    const totals = {
      grossAnnual: 0,
      psfAnnual: 0,
      pUnitAnnual: 0,
      grossMonthly: 0,
      psfMonthly: 0,
      pUnitMonthly: 0,
    };
    const walk = (obj) => {
      for (const v of Object.values(obj || {})) {
        if (isLeaf(v)) {
          for (const k of LEAF_KEYS) totals[k] += Number(v[k] || 0);
        } else if (typeof v === "object") {
          walk(v);
        }
      }
    };
    walk(sectionObj || {});
    return totals;
  };

  const inc = sumSectionColumns(data.Income);
  const vac = sumSectionColumns(data.Vacancy);
  const opx = sumSectionColumns(data.OperatingExpenses);
  const capx = sumSectionColumns(data.CapitalExpenses);

  // Financial logic remains on Annual Gross
  const egi = inc.grossAnnual - vac.grossAnnual;
  const noi = egi - opx.grossAnnual;
  const unlevered = noi - capx.grossAnnual;
  const financing =
    data?.CapitalExpenses?.["Financing Expense"]?.grossAnnual || 0;
  const levered = unlevered - financing;

  return (
    <div className="income-statement-panel">
      <div className="isp-header">
        <h3>📊 Income Statement</h3>

        <div className="isp-right">
          {saving ? (
            <span className="status-pill is-saving">
              <span className="dot dot-spin" /> Saving…
            </span>
          ) : saveError ? (
            <span className="status-pill is-error">
              <span className="dot" /> Save failed
            </span>
          ) : lastSavedAt ? (
            <span
              className={`status-pill is-saved ${justSaved ? "flash" : ""}`}
            >
              <span className="dot" /> Saved{" "}
              {lastSavedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}

          <button
            className="btn-save"
            onClick={() =>
              setViewMode((m) => (m === "annual" ? "monthly" : "annual"))
            }
            disabled={saving}
          >
            {viewMode === "annual" ? "Monthly View" : "Annual View"}
          </button>

          <button
            className="btn-save"
            onClick={() => setGroupedView((v) => !v)}
            disabled={saving}
          >
            {groupedView ? "Compact View" : "Grouped View"}
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "💾 Save"}
          </button>
        </div>
      </div>

      {["Income", "Vacancy", "OperatingExpenses", "CapitalExpenses"].map(
        (section) => (
          <RecursiveSection
            key={section}
            title={section.replace(/([A-Z])/g, " $1").trim()}
            data={data[section]}
            onChange={(updated) =>
              setData((prev) => ({ ...prev, [section]: updated }))
            }
            groupedView={groupedView}
            viewMode={viewMode}
          />
        )
      )}

      <TotalsBar label="EGI (Effective Gross Income)" value={egi} />
      <TotalsBar label="Gross Expenses" value={opx.grossAnnual} />
      <TotalsBar label="Net Operating Income" value={noi} />
      <TotalsBar label="Unlevered Free Cash Flow" value={unlevered} />
      <TotalsBar label="Leveraged Free Cash Flow" value={levered} />

      <button className="btn-save" onClick={handleSave}>
        💾 Save
      </button>
      <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
        <button className="btn-save" onClick={handleExportCSV}>
          📊 Export CSV
        </button>
        <button className="btn-save" onClick={handleExportPDF}>
          📄 Export PDF
        </button>
      </div>
    </div>
  );
}

/** ========== Recursive renderer ========== */
/** ========== Recursive renderer (collapsible branches) ========== */
function RecursiveSection({
  title,
  data = {},
  onChange,
  groupedView,
  viewMode,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const { prompt, confirm } = useDialog(); // ⬅️ add this

  // Track collapsed state per path (recursive)
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());

  const setAtPath = (path, updater) => {
    const keys = path.split(".");
    const updated = structuredClone(data);
    let cur = updated;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] ||= {};
    const k = keys.at(-1);
    cur[k] = updater(cur[k]);
    onChange(updated);
  };

  const updateLeafCell = (path, columnKey, value) => {
    setAtPath(path, (prev) => {
      const leaf = isLeaf(prev) ? { ...prev } : newLeaf();
      leaf[columnKey] = Number.isFinite(value) ? value : 0;
      return leaf;
    });
  };

  const updateLeafCellSynced = (path, logicalKey, value) => {
    // logicalKey ∈ {'gross','psf','punit'}
    const n = Number.isFinite(value) ? value : 0;
    const map = {
      annual: { gross: "grossAnnual", psf: "psfAnnual", punit: "pUnitAnnual" },
      monthly: {
        gross: "grossMonthly",
        psf: "psfMonthly",
        punit: "pUnitMonthly",
      },
    };
    const kA = map.annual[logicalKey];
    const kM = map.monthly[logicalKey];

    setAtPath(path, (prev) => {
      const leaf = isLeaf(prev) ? { ...prev } : newLeaf();
      if (viewMode === "annual") {
        leaf[kA] = n;
        leaf[kM] = n / 12;
      } else {
        leaf[kM] = n;
        leaf[kA] = n * 12;
      }
      return leaf;
    });
  };

  // Use our confirm dialog before deleting
  const deleteAtPath = async (path) => {
    if (!path) return;
    const ok = await confirm({
      title: "Delete this item?",
      message: `This will remove "${path}" and all its sub-items.`,
    });
    if (!ok) return;

    const keys = path.split(".");
    const updated = structuredClone(data);
    let cur = updated;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    delete cur[keys.at(-1)];
    onChange(updated);
  };

  // Can we "ungroup" (turn a branch back into a leaf)?
  const canUngroup = (node) => {
    if (!node || typeof node !== "object" || isLeaf(node)) return false;
    const entries = Object.entries(node);
    if (entries.length !== 1) return false;
    const [k, v] = entries[0];
    return isLeaf(v); // exactly one child and it's a leaf (often "Default")
  };

  // Replace branch with its only child (usually "Default")
  const ungroupAtPath = (path) => {
    setAtPath(path, (prev) => {
      if (!canUngroup(prev)) return prev;
      const onlyChild = Object.values(prev)[0];
      return { ...onlyChild }; // leaf replaces branch
    });
  };

  // Make addItem async and use our prompt
  const addItem = async (path = "") => {
    const raw = await prompt({
      title: "New line item",
      message: path ? `Parent: ${path}` : `Add to ${title}`,
      placeholder: "e.g., Landscaping",
      defaultValue: "",
    });
    if (raw == null) return; // cancelled
    const label =
      String(raw)
        .trim()
        .replace(/[~*/\[\]]/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 80) || "Item";

    const updated = structuredClone(data);
    let cur = updated;
    if (path) path.split(".").forEach((k) => (cur = cur[k] ||= {}));
    const key = (() => {
      let k = label,
        i = 2;
      while (Object.prototype.hasOwnProperty.call(cur, k))
        k = `${label} ${i++}`;
      return k;
    })();
    cur[key] = newLeaf();
    onChange(updated);
  };

  // Replace the old promoteToObject with a dialog-driven version
  const promoteToObject = async (path) => {
    const raw = await prompt({
      title: "Add a sub-item",
      message: `Parent: ${path}`,
      placeholder: "e.g., Landscaping",
      defaultValue: "",
    });
    if (raw == null) return; // cancelled

    const label =
      String(raw)
        .trim()
        .replace(/[~*/\[\]]/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 80) || "Subitem";

    setAtPath(path, (prev) => {
      const leaf = isLeaf(prev) ? prev : newLeaf();

      // If the parent was a leaf → convert to an object with "Default" + new sub
      const branch = { Default: leaf };

      // Ensure uniqueness
      let k = label,
        i = 2;
      while (Object.prototype.hasOwnProperty.call(branch, k))
        k = `${label} ${i++}`;

      branch[k] = newLeaf();
      return branch;
    });
  };

  // Collapse helpers
  const isCollapsed = (path) => collapsedPaths.has(path);
  const togglePath = (path) =>
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });

  const collapseAll = () => {
    // mark every existing branch path as collapsed
    const all = new Set();
    const walk = (obj, path = "") => {
      for (const [k, v] of Object.entries(obj || {})) {
        const p = path ? `${path}.${k}` : k;
        if (!isLeaf(v) && typeof v === "object") {
          all.add(p);
          walk(v, p);
        }
      }
    };
    walk(data);
    setCollapsedPaths(all);
  };
  const expandAll = () => setCollapsedPaths(new Set());

  /** ---- leaf editor (grouped / compact) ---- */
  const renderLeaf = (fullPath, val) => {
    if (groupedView) {
      const title = viewMode === "annual" ? "Annual" : "Monthly";
      const grossKey = viewMode === "annual" ? "grossAnnual" : "grossMonthly";
      const psfKey = viewMode === "annual" ? "psfAnnual" : "psfMonthly";
      const puKey = viewMode === "annual" ? "pUnitAnnual" : "pUnitMonthly";
      return (
        <div className="group-card">
          <div className="group-title">{title}</div>
          <div className="group-grid">
            <Field
              label={title === "Annual" ? "Gross Annual" : "Gross Monthly"}
              value={val[grossKey]}
              onChange={(n) => updateLeafCellSynced(fullPath, "gross", n)}
            />
            <Field
              label="PSF"
              value={val[psfKey]}
              onChange={(n) => updateLeafCellSynced(fullPath, "psf", n)}
            />
            <Field
              label="PUnit"
              value={val[puKey]}
              onChange={(n) => updateLeafCellSynced(fullPath, "punit", n)}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="six-col-inputs">
        <Field
          label="Gross Annual"
          value={val.grossAnnual}
          onChange={(n) => updateLeafCell(fullPath, "grossAnnual", n)}
        />
        <Field
          label="PSF (Annual)"
          value={val.psfAnnual}
          onChange={(n) => updateLeafCell(fullPath, "psfAnnual", n)}
        />
        <Field
          label="PUnit (Annual)"
          value={val.pUnitAnnual}
          onChange={(n) => updateLeafCell(fullPath, "pUnitAnnual", n)}
        />
        <Field
          label="Gross Monthly"
          value={val.grossMonthly}
          onChange={(n) => updateLeafCell(fullPath, "grossMonthly", n)}
        />
        <Field
          label="PSF (Monthly)"
          value={val.psfMonthly}
          onChange={(n) => updateLeafCell(fullPath, "psfMonthly", n)}
        />
        <Field
          label="PUnit (Monthly)"
          value={val.pUnitMonthly}
          onChange={(n) => updateLeafCell(fullPath, "pUnitMonthly", n)}
        />
      </div>
    );
  };

  /** ---- branch subtotals (read-only) ---- */
  const renderBranchTotals = (val) => {
    const t = sumNode(val);
    return groupedView ? (
      <div className="group-card totals-card">
        <div className="group-title">
          {viewMode === "annual" ? "Annual (Subtotal)" : "Monthly (Subtotal)"}
        </div>
        <div className="group-grid">
          <ReadOnly
            label={viewMode === "annual" ? "Gross Annual" : "Gross Monthly"}
            value={viewMode === "annual" ? t.grossAnnual : t.grossMonthly}
          />
          <ReadOnly
            label="PSF"
            value={viewMode === "annual" ? t.psfAnnual : t.psfMonthly}
          />
          <ReadOnly
            label="PUnit"
            value={viewMode === "annual" ? t.pUnitAnnual : t.pUnitMonthly}
          />
        </div>
      </div>
    ) : (
      <div className="six-col-inputs totals-row">
        <ReadOnly label="Gross Annual" value={t.grossAnnual} />
        <ReadOnly label="PSF (Annual)" value={t.psfAnnual} />
        <ReadOnly label="PUnit (Annual)" value={t.pUnitAnnual} />
        <ReadOnly label="Gross Monthly" value={t.grossMonthly} />
        <ReadOnly label="PSF (Monthly)" value={t.psfMonthly} />
        <ReadOnly label="PUnit (Monthly)" value={t.pUnitMonthly} />
      </div>
    );
  };

  const render = (obj, path = "", depth = 0) =>
    Object.entries(obj).map(([key, val]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const indent = { marginLeft: `${depth * 20}px` };

      // LEAF
      if (isLeaf(val)) {
        return (
          <div key={fullPath} className="nested-line-item" style={indent}>
            <div className="line-item">
              {/* caret placeholder for alignment */}
              <span className="caret-spacer" />
              <span className="line-label">{key}</span>
              {renderLeaf(fullPath, val)}
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

      // BRANCH
      const collapsed = isCollapsed(fullPath);
      return (
        <div key={fullPath} className="nested-line-item" style={indent}>
          <div className="line-item">
            <button className="caret-btn" onClick={() => togglePath(fullPath)}>
              {collapsed ? "▸" : "▾"}
            </button>
            <span className="line-label">{key}</span>
            {renderBranchTotals(val)}
            <div className="row-actions">
              <button
                className="sub-btn"
                onClick={async () => await addItem(fullPath)}
              >
                + Sub
              </button>
              {canUngroup(val) && (
                <button
                  className="sub-btn"
                  onClick={() => ungroupAtPath(fullPath)}
                  title="Replace this group with its only child"
                >
                  ↧ Ungroup
                </button>
              )}
              <button
                className="danger-btn"
                onClick={() => deleteAtPath(fullPath)}
              >
                🗑 Delete
              </button>
            </div>
          </div>

          {!collapsed && render(val || {}, fullPath, depth + 1)}
        </div>
      );
    });

  return (
    <div className="statement-section">
      <h4 onClick={() => setCollapsed((c) => !c)}>
        <span>
          <span>
            {collapsed ? "▸" : "▾"} {title} {groupedView ? `• ${viewMode}` : ""}
          </span>
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <button
            className="add-btn"
            onClick={async (e) => {
              e.stopPropagation();
              await addItem(); // adds at section root
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
            title="Collapse all subitems"
          >
            Collapse All
          </button>
          <button
            className="add-btn"
            onClick={(e) => {
              e.stopPropagation();
              expandAll();
            }}
            title="Expand all subitems"
          >
            Expand All
          </button>
        </span>
      </h4>
      {!collapsed && render(data)}
    </div>
  );
}

/** Small input field */
function Field({ label, value, onChange }) {
  return (
    <label className="col-field">
      <span className="col-label">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

/** Read-only field for subtotals */
function ReadOnly({ label, value }) {
  return (
    <label className="col-field readonly">
      <span className="col-label">{label}</span>
      <input type="number" value={Number(value || 0)} readOnly />
    </label>
  );
}

/** Totals bar (annual gross for finance math) */
function TotalsBar({ label, value }) {
  return (
    <div className="subtotal-row">
      <strong>{label}:</strong>
      <span>${Number(value || 0).toLocaleString()}</span>
    </div>
  );
}
