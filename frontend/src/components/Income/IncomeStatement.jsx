// components/Income/IncomeStatement.jsx
import React, { useEffect, useRef, useState } from "react"; // <-- add useRef
import { useAuth } from "../../app/AuthProvider";
import toast from "react-hot-toast";
import {
  getIncomeStatement,
  saveIncomeStatement,
} from "../../services/firestoreService";
import { migrateMixedNodes } from "../../utils/income/incomeMigrate.js";
import { defaultStructure, newLeaf } from "../../utils/income/incomeDefaults.js";
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section.jsx";
import TotalsBar from "./TotalsBar.jsx";
import { exportCSV, exportPDF } from "../../utils/income/exportIncome.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";
import "../../styles/income-statement.css";
import { SECTION_LAYOUT } from "../../utils/income/incomeLayout.js";

// ---------------- Shared helpers ----------------
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
const LEGACY_LEAF_KEYS = [
  "grossAnnual",
  "psfAnnual",
  "pUnitAnnual",
  "grossMonthly",
  "psfMonthly",
  "pUnitMonthly",
];
const KEY_ALIASES = {
  pUnitAnnual: "punitAnnual",
  pUnitMonthly: "punitMonthly",
};

const isPlainObject = (v) =>
  v != null &&
  typeof v === "object" &&
  Object.getPrototypeOf(v) === Object.prototype;

const toNumber = (v) => (v === undefined || v === null || v === "" ? 0 : +v);

const coerceLeaf = (leaf = {}) => {
  const out = {};
  for (const k of LEAF_KEYS) out[k] = toNumber(leaf[k]);
  return out;
};

const isLeaf = (v) =>
  v &&
  typeof v === "object" &&
  LEAF_KEYS.every((k) => typeof v[k] === "number");

const normalizeTree = (node) => {
  if (!isPlainObject(node)) return node;

  // rename legacy keys at this node
  for (const [from, to] of Object.entries(KEY_ALIASES)) {
    if (from in node) {
      if (!(to in node)) node[to] = node[from];
      delete node[from];
    }
  }

  const keys = Object.keys(node);
  const hasLeafKey = keys.some(
    (k) => LEAF_KEYS.includes(k) || LEGACY_LEAF_KEYS.includes(k)
  );
  const hasChild = keys.some(
    (k) =>
      !LEAF_KEYS.includes(k) &&
      !LEGACY_LEAF_KEYS.includes(k) &&
      isPlainObject(node[k])
  );

  if (hasLeafKey && !hasChild) return coerceLeaf(node);

  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (LEAF_KEYS.includes(k) || LEGACY_LEAF_KEYS.includes(k)) continue;
    out[k] = normalizeTree(v);
  }
  return out;
};

const sumSectionColumns = (sectionObj) => {
  const totals = Object.fromEntries(LEAF_KEYS.map((k) => [k, 0]));
  const walk = (obj) =>
    Object.values(obj || {}).forEach((v) => {
      if (isLeaf(v)) LEAF_KEYS.forEach((k) => (totals[k] += Number(v[k] || 0)));
      else if (typeof v === "object") walk(v);
    });
  walk(sectionObj || {});
  return totals;
};

// --------- UI-only Operating Expense subtotals (no Section/CSS changes) ----------
// NOTE: preserve nested objects for "line" rows so +Sub can add children under them.
const ZERO_LEAF = () => coerceLeaf({});

const sumAny = (node) => {
  // Recursively sum a node (leaf or branch)
  if (!node) return ZERO_LEAF();
  if (isLeaf(node)) return coerceLeaf(node);
  const out = ZERO_LEAF();
  Object.values(node).forEach((v) => {
    const partial = sumAny(v);
    for (const k of LEAF_KEYS) out[k] += partial[k];
  });
  return out;
};

const TAX_KEYS = [
  "County-Level Property Taxes",
  "Municipality-Level Property Taxes",
  "Other Taxes",
];

const INS_KEYS = [
  "Property Insurance",
  "Casualty Insurance",
  "Flood Insurance",
  "Other Insurance",
];

const CAM_KEYS = [
  "Common-Area Utilities",
  "CAM",
  "Common-Area Routine Labor",
  "Other CAM",
];

const ADMIN_KEYS = [
  "Management",
  "Administrative & Legal",
  "Other Administrative Expenses",
];

const COMPUTED_OPEX_KEYS = new Set([
  "Subtotal Property Taxes",
  "Subtotal Insurance",
  "Subtotal CAM",
  "Subtotal Administrative & Other",
  "Total Operating Expenses",
]);

// Preserve real objects for line keys; inject computed leaves for subtotal/total keys
const buildOperatingExpensesView = (opex, includeInlineTotal = false) => {
  const out = {};

  // Taxes
  TAX_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal Property Taxes"] = sumKeys(opex, TAX_KEYS);

  // Insurance
  INS_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal Insurance"] = sumKeys(opex, INS_KEYS);

  // CAM
  CAM_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal CAM"] = sumKeys(opex, CAM_KEYS);

  // Admin & Other
  ADMIN_KEYS.forEach((k) => (out[k] = opex?.[k] ?? newLeaf()));
  out["Subtotal Administrative & Other"] = sumKeys(opex, ADMIN_KEYS);

  if (includeInlineTotal) {
    out["Total Operating Expenses"] = sumKeys(opex, [
      ...TAX_KEYS, ...INS_KEYS, ...CAM_KEYS, ...ADMIN_KEYS,
    ]);
  }
  return out;
};

const sumKeys = (section, keys) => {
  const out = ZERO_LEAF();
  keys.forEach((k) => {
    const partial = sumAny(section?.[k]);
    for (const f of LEAF_KEYS) out[f] += partial[f];
  });
  return out;
};
// -------------------------------------------------------------------------------

export default function IncomeStatement({
  rowData,
  propertyId,
  onSaveRowValue,
}) {
  const { user } = useAuth();
  const [data, setData] = useState(defaultStructure);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { groupedView } = useIncomeView();
  const [viewMode, setViewMode] = useState("monthly");
  const opexRef = useRef(null);

  useEffect(() => {
  const root = opexRef.current;
  if (!root) return;

  const isComputedLabel = (txt) =>
    /^Subtotal\b/.test(txt) || txt === "Total Operating Expenses";

  root.querySelectorAll(".line-item.section-row").forEach((rowEl) => {
    const labelEl =
      rowEl.querySelector(".label-text") || rowEl.querySelector(".line-label");
    if (!labelEl) return;

    const label = (labelEl.textContent || "").trim();
    const computed = isComputedLabel(label);

    // mark row (handy for CSS if you want)
    rowEl.classList.toggle("is-computed-row", computed);

    // 1) keep the grid cell, but hide its contents & block clicks
    const actions = rowEl.querySelector(".row-actions");
    if (actions) {
      actions.style.visibility = computed ? "hidden" : "visible";
      actions.style.pointerEvents = computed ? "none" : "";
    }

    // 2) lock inputs for computed rows (still visible, read-only)
    rowEl.querySelectorAll("input").forEach((inp) => {
      if (computed) {
        inp.readOnly = true;
        inp.classList.add("ro");
        inp.style.pointerEvents = "none";
      } else {
        inp.readOnly = false;
        inp.classList.remove("ro");
        inp.style.pointerEvents = "";
      }
    });
  });
  }, [data.OperatingExpenses, viewMode]);

  useEffect(() => {
    if (!user || !propertyId) return;
    (async () => {
      const saved = await getIncomeStatement(user.uid, propertyId);
      const cleaned = migrateMixedNodes(
        structuredClone(saved || defaultStructure)
      );
      setData(normalizeTree(cleaned ?? defaultStructure));
      setLoaded(true);
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

  // Roll-ups for footer (from REAL data)
  const inc = sumSectionColumns(data.Income);
  const opx = sumSectionColumns(data.OperatingExpenses);
  const capx = sumSectionColumns(data.CapitalExpenses);
  const egi = inc.grossAnnual;
  const noi = egi - opx.grossAnnual;
  const unlevered = noi - capx.grossAnnual;
  const financing = data?.CapitalExpenses?.["Financing Expense"]?.grossAnnual || 0;
  const levered = unlevered - financing;

  const onSave = async () => {
    if (!user || !propertyId) return;
    try {
      setSaving(true);
      setError(null);
      await saveIncomeStatement(user.uid, propertyId, data);
      toast.success("✅ Saved Income Statement");
      setLastSavedAt(new Date());
      onSaveRowValue?.(inc.grossAnnual);
    } catch (e) {
      setError(e?.message || "Save failed");
      toast.error("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Derived (display-only) OPEX with subtotals (preserves nested lines)
  const opexView = buildOperatingExpensesView(data.OperatingExpenses || {}, false);

  // ---- onChange that works with BOTH Section signatures ----
  const handleSectionChange =
    (sectionKey) =>
    (...args) => {
      // Signature A: onChange(updatedSectionObject) — typical for your Section with +Sub
      if (
        args.length === 1 &&
        typeof args[0] === "object" &&
        !Array.isArray(args[0])
      ) {
        const updatedSection = args[0];
        setData((prev) => {
          const next = structuredClone(prev);

          if (sectionKey === "OperatingExpenses") {
            // Merge only LINE keys, ignore computed keys; PRESERVE NESTED STRUCTURE
            const lineKeys = new Set([
              ...TAX_KEYS,
              ...INS_KEYS,
              ...CAM_KEYS,
              ...ADMIN_KEYS,
            ]);
            const dest = { ...(next.OperatingExpenses || {}) };

            for (const [k, v] of Object.entries(updatedSection || {})) {
              if (COMPUTED_OPEX_KEYS.has(k)) continue; // skip UI-only subtotals/totals
              if (!lineKeys.has(k)) continue; // only our known lines
              // normalize at subtree level so new +Sub children are kept as objects, leaves are coerced
              dest[k] = normalizeTree(v);
            }
            next.OperatingExpenses = dest;
          } else {
            // Income / CapitalExpenses: accept entire object, normalize for numbers
            const cleaned = {};
            for (const [k, v] of Object.entries(updatedSection || {})) {
              cleaned[k] = normalizeTree(v);
            }
            next[sectionKey] = cleaned;
          }
          return next;
        });
        return;
      }

      // Signature B: onChange(sectionKey,rowKey,field,val)
      if (args.length === 4 && typeof args[0] === "string") {
        const [updatedKey, rowKey, field, val] = args;
        if (
          updatedKey === "OperatingExpenses" &&
          COMPUTED_OPEX_KEYS.has(rowKey)
        ) {
          return; // ignore writes to computed UI rows
        }
        setData((prev) => ({
          ...prev,
          [updatedKey]: {
            ...prev[updatedKey],
            [rowKey]: {
              ...(prev[updatedKey]?.[rowKey] || {}),
              [field]: toNumber(val),
            },
          },
        }));
      }
    };

  return (
    <div className="income-statement-panel">
      <HeaderBar
        saving={saving}
        error={error}
        lastSavedAt={lastSavedAt}
        onSave={onSave}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {SECTION_LAYOUT.map(({ key, title }) =>
        key === "OperatingExpenses" ? (
          <div key={key} ref={opexRef}>
            <Section
              sectionKey={key}
              title={title}
              data={opexView} // your derived view with subtotals
              onChange={handleSectionChange(key)}
              viewMode={viewMode}
            />
          </div>
        ) : (
          <Section
            key={key}
            sectionKey={key}
            title={title}
            data={data[key]}
            onChange={handleSectionChange(key)}
            viewMode={viewMode}
          />
        )
      )}

      <TotalsBar label="EGI (Effective Gross Income)" value={egi} />
      <TotalsBar label="Gross Expenses" value={opx.grossAnnual} />
      <TotalsBar label="Net Operating Income" value={noi} />
      <TotalsBar label="Unlevered Free Cash Flow" value={unlevered} />
      <TotalsBar label="Leveraged Free Cash Flow" value={levered} />

      {/* <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
        <button
          className="btn-save"
          onClick={() => exportCSV(data, propertyId)}
        >
          📊 Export CSV
        </button>
        <button
          className="btn-save"
          onClick={() => exportPDF(data, propertyId)}
        >
          📄 Export PDF
        </button>
      </div> */}
    </div>
  );
}
