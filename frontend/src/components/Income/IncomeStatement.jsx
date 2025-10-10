// components/Income/IncomeStatement.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import toast from "react-hot-toast";

import {
  getIncomeStatement,
  saveIncomeStatement,
} from "../../services/firestoreService";

import { migrateMixedNodes } from "../../utils/income/incomeMigrate.js";
import {
  defaultStructure,
  newLeaf,
} from "../../utils/income/incomeDefaults.js";
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section.jsx";

import { useIncomeView } from "../../app/providers/IncomeViewProvider.jsx";
import { SECTION_LAYOUT } from "../../utils/income/incomeLayout.js";

import "../../styles/Income/income-panel.css";

/* ---------------- shared helpers ---------------- */
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

const LEGACY_LEAF_KEYS = ["pUnitAnnual", "pUnitMonthly"];

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

  // fix legacy casing
  for (const k of LEGACY_LEAF_KEYS) {
    if (k in node) {
      const to = k === "pUnitAnnual" ? "punitAnnual" : "punitMonthly";
      if (!(to in node)) node[to] = node[k];
      delete node[k];
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

const ZERO_LEAF = () => coerceLeaf({});

const sumAny = (node) => {
  if (!node) return ZERO_LEAF();
  if (isLeaf(node)) return coerceLeaf(node);
  const out = ZERO_LEAF();
  Object.values(node).forEach((v) => {
    const partial = sumAny(v);
    for (const k of LEAF_KEYS) out[k] += partial[k];
  });
  return out;
};

/* --------- UI-only Operating Expense subtotals (computed, read-only) ---------- */
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

const sumKeys = (section, keys) => {
  const out = ZERO_LEAF();
  keys.forEach((k) => {
    const partial = sumAny(section?.[k]);
    for (const f of LEAF_KEYS) out[f] += partial[f];
  });
  return out;
};

// derive a view that includes Subtotal/Total lines;
// keep *real* objects for user rows so +Sub still works.
const buildOperatingExpensesView = (opex = {}) => {
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

  // Inline total
  out["Total Operating Expenses"] = sumKeys(opex, [
    ...TAX_KEYS,
    ...INS_KEYS,
    ...CAM_KEYS,
    ...ADMIN_KEYS,
  ]);

  return out;
};
/* ----------------------------------------------------------------------------- */

/** Pull GBA (sqft) and Units from rowData, with resilient fallbacks */
const extractMetricsFromRow = (rowData) => {
  const num = (v) => (Number.isFinite(+v) ? +v : 0);

  const gbaSqft = num(
    rowData?.grossBuildingAreaSqFt ??
      rowData?.grossBuildingArea ??
      rowData?.gbaSqFt ??
      rowData?.gba ??
      rowData?.sqft ??
      rowData?.squareFeet
  );

  const units = num(
    rowData?.units ??
      rowData?.unitCount ??
      rowData?.numUnits ??
      rowData?.resUnits ??
      rowData?.Units
  );

  return { gbaSqft, units };
};

export default function IncomeStatement({
  rowData,
  propertyId,
  onSaveRowValue,
}) {
  const { user } = useAuth();
  const { groupedView } = useIncomeView();
  const [data, setData] = useState(defaultStructure);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const opexRef = useRef(null);



  // metrics for LeafEditor (GSR auto-calc)
  const metrics = useMemo(
    () => extractMetricsFromRow(rowData || {}),
    [rowData]
  );
  const deriveGSR = useMemo(() => new Set(["Gross Scheduled Rent"]), []);
  const emptySet = useMemo(() => new Set(), []);

  // lock inputs for computed rows (Subtotal..., Total Operating Expenses)
  useEffect(() => {
    const root = opexRef.current;
    if (!root) return;

    const isComputedLabel = (txt) =>
      /^Subtotal\b/.test(txt) || txt === "Total Operating Expenses";

    root.querySelectorAll(".line-item.section-row").forEach((rowEl) => {
      const labelEl =
        rowEl.querySelector(".label-text") ||
        rowEl.querySelector(".line-label");
      if (!labelEl) return;

      const label = (labelEl.textContent || "").trim();
      const computed = isComputedLabel(label);

      // hide row actions, block clicks
      const actions = rowEl.querySelector(".row-actions");
      if (actions) {
        actions.style.visibility = computed ? "hidden" : "visible";
        actions.style.pointerEvents = computed ? "none" : "";
      }

      // make inputs readonly for computed lines
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
  }, [data.OperatingExpenses]);

  // load once
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

  // optional: drive a specific row value from the table row (example: BRI)
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

  // roll-ups for footer
  const inc = sumSectionColumns(data.Income);
  const opx = sumSectionColumns(data.OperatingExpenses);
  const capx = sumSectionColumns(data.CapitalExpenses);
  const egi = inc.grossAnnual;
  const noi = egi - opx.grossAnnual;
  const unlevered = noi - capx.grossAnnual;
  const financing =
    data?.CapitalExpenses?.["Financing Expense"]?.grossAnnual || 0;
  const levered = unlevered - financing;

  const onSave = async () => {
    if (!user || !propertyId) return;
    try {
      setSaving(true);
      setError(null);
      await saveIncomeStatement(user.uid, propertyId, data);
      toast.success("✅ Saved Income Statement");
      setLastSavedAt(new Date());
      // update the table row cell (choose what you want to push up; using EGI here)
      onSaveRowValue?.(inc.grossAnnual);
    } catch (e) {
      setError(e?.message || "Save failed");
      toast.error("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Derived OPEX with computed lines for display (and read-only behavior)
  const opexView = buildOperatingExpensesView(data.OperatingExpenses || {});

  // Section always calls onChange(updatedSectionObject)
  const handleSectionChange = (sectionKey) => (updatedSection) => {
    setData((prev) => {
      const next = structuredClone(prev);

      if (sectionKey === "OperatingExpenses") {
        // merge only *real* line keys; ignore computed keys from the view
        const lineKeys = new Set([
          ...TAX_KEYS,
          ...INS_KEYS,
          ...CAM_KEYS,
          ...ADMIN_KEYS,
        ]);
        const dest = { ...(next.OperatingExpenses || {}) };
        for (const [k, v] of Object.entries(updatedSection || {})) {
          if (!lineKeys.has(k)) continue; // skip computed
          dest[k] = normalizeTree(v);
        }
        next.OperatingExpenses = dest;
      } else {
        // Income / CapitalExpenses: accept entire object
        const cleaned = {};
        for (const [k, v] of Object.entries(updatedSection || {})) {
          cleaned[k] = normalizeTree(v);
        }
        next[sectionKey] = cleaned;
      }
      return next;
    });
  };

  // rows that must NOT be draggable in OPEX
  const LOCKED_OPEX = new Set([
    "Subtotal Property Taxes",
    "Subtotal Insurance",
    "Subtotal CAM",
    "Subtotal Administrative & Other",
    "Total Operating Expenses",
  ]);

  return (
    <div className="income-statement-panel">
      <HeaderBar
        saving={saving}
        error={error}
        lastSavedAt={lastSavedAt}
        onSave={onSave}
      />

      {SECTION_LAYOUT.map(({ key, title }) =>
        key === "OperatingExpenses" ? (
          <div key={key} ref={opexRef}>
            <Section
              title={title}
              data={opexView} // derived view with computed rows
              onChange={handleSectionChange(key)}
              enableSort // top-level drag (children move with parent)
              lockKeys={LOCKED_OPEX} // computed rows not draggable
              metrics={metrics} // safe to pass; not used by computed rows
              deriveKeys={emptySet}
            />
          </div>
        ) : (
          <Section
            key={key}
            title={title}
            data={data[key]}
            onChange={handleSectionChange(key)}
            enableSort
            /* Pass GBA/Units down for reversible GSR math */
            metrics={metrics}
            deriveKeys={key === "Income" ? deriveGSR : emptySet}
          />
        )
      )}

      {/* Uncomment if you want the footer rollups visible */}
      {/* <TotalsBar label="EGI (Effective Gross Income)" value={egi} />
      <TotalsBar label="Gross Expenses" value={opx.grossAnnual} />
      <TotalsBar label="Net Operating Income" value={noi} />
      <TotalsBar label="Unlevered Free Cash Flow" value={unlevered} />
      <TotalsBar label="Leveraged Free Cash Flow" value={levered} /> */}
    </div>
  );
}
