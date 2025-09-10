import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/AuthProvider";
import toast from "react-hot-toast";
import { getIncomeStatement, saveIncomeStatement } from "../../services/firestoreService";
import { migrateMixedNodes } from "../../utils/incomeMigrate.js";
import { defaultStructure, newLeaf } from "../../utils/incomeDefaults.js";
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section.jsx";
import TotalsBar from "./TotalsBar.jsx";
import { exportCSV, exportPDF } from "../../utils/exportIncome.js";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";
import "../../styles/income-statement.css";

// IncomeStatement.jsx (helpers at the top)
const LEAF_KEYS = [
  "grossAnnual","psfAnnual","punitAnnual","rateAnnual",
  "grossMonthly","psfMonthly","punitMonthly","rateMonthly",
];

export const LEGACY_LEAF_KEYS = [
  "grossAnnual","psfAnnual","pUnitAnnual",    // 👈 legacy casing
  "grossMonthly","psfMonthly","pUnitMonthly", // 👈 legacy casing
];

const KEY_ALIASES = { pUnitAnnual: "punitAnnual", pUnitMonthly: "punitMonthly" };

const isPlainObject = (v) =>
  v != null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

const toNumber = (v) => (v === undefined || v === null || v === "" ? 0 : +v);

/**
 * Normalize the whole tree:
 *  - rename legacy camel-cased keys to lowercase (pUnit* -> punit*)
 *  - if an object is *only* a leaf (no non-leaf children), coerce its leaf values to numbers
 *  - if an object is a *branch*, strip any dangling leaf keys so they don't render as rows
 */
const normalizeTree = (node) => {
  if (!isPlainObject(node)) return node;

  // rename legacy keys in-place first
  for (const [from, to] of Object.entries(KEY_ALIASES)) {
    if (from in node) {
      if (!(to in node)) node[to] = node[from];
      delete node[from];
    }
  }

  const keys = Object.keys(node);
  const hasAnyLeafKey =
    keys.some((k) => LEAF_KEYS.includes(k) || LEGACY_LEAF_KEYS.includes(k));

  const hasNonLeafChildren =
    keys.some((k) => !LEAF_KEYS.includes(k) && !LEGACY_LEAF_KEYS.includes(k) && isPlainObject(node[k]));

  // If it's a *pure* leaf (only leaf keys, no object children), coerce values and return a clean leaf
  if (hasAnyLeafKey && !hasNonLeafChildren) {
    const out = {};
    for (const k of LEAF_KEYS) out[k] = toNumber(node[k]);
    return out;
  }

  // Otherwise it's a branch: recurse children and drop dangling leaf keys at this level
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (LEAF_KEYS.includes(k) || LEGACY_LEAF_KEYS.includes(k)) continue; // strip
    out[k] = normalizeTree(v);
  }
  return out;
};

const isLeaf = (v) =>
  v && typeof v === "object" && LEAF_KEYS.every((k) => typeof v[k] === "number");

const sumSectionColumns = (sectionObj) => {
  const totals = {
    grossAnnual:0, psfAnnual:0, punitAnnual:0, rateAnnual:0,
    grossMonthly:0, psfMonthly:0, punitMonthly:0, rateMonthly:0,
  };
  const walk = (obj) => Object.values(obj||{}).forEach((v)=> {
    if (isLeaf(v)) LEAF_KEYS.forEach((k)=> totals[k]+= Number(v[k]||0));
    else if (typeof v==="object") walk(v);
  });
  walk(sectionObj||{});
  return totals;
};

export default function IncomeStatement({ rowData, propertyId }) {
  const { user } = useAuth();
  const [data, setData] = useState(defaultStructure);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { groupedView } = useIncomeView();


// Remove dangling leaf keys that appear at branch levels
const stripDanglingLeafKeys = (node) => {
  if (!isPlainObject(node)) return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (LEAF_KEYS.includes(k)) {
      // Skip these at branch level
      continue;
    }
    out[k] = isPlainObject(v) ? stripDanglingLeafKeys(v) : v;
  }
  return out;
};

useEffect(() => {
  if (!user || !propertyId) return;
  (async () => {
    const saved = await getIncomeStatement(user.uid, propertyId);
    const cleaned = migrateMixedNodes(structuredClone(saved || defaultStructure));

    // ✅ normalize before rendering
    const normalized = normalizeTree(cleaned ?? defaultStructure);
    setData(normalized);
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

  const onSave = async () => {
    if (!user || !propertyId) return;
    try {
      setSaving(true); setError(null);
      await saveIncomeStatement(user.uid, propertyId, data);
      toast.success("✅ Saved Income Statement");
      setLastSavedAt(new Date());
    } catch (e) {
      setError(e?.message || "Save failed");
      toast.error("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inc = sumSectionColumns(data.Income);
  const vac = sumSectionColumns(data.Vacancy);
  const opx = sumSectionColumns(data.OperatingExpenses);
  const capx = sumSectionColumns(data.CapitalExpenses);
  const egi = inc.grossAnnual - vac.grossAnnual;
  const noi = egi - opx.grossAnnual;
  const unlevered = noi - capx.grossAnnual;
  const financing = data?.CapitalExpenses?.["Financing Expense"]?.grossAnnual || 0;
  const levered = unlevered - financing;

  return (
    <div className="income-statement-panel">
      <HeaderBar saving={saving} error={error} lastSavedAt={lastSavedAt} onSave={onSave} />

      {["Income","Vacancy","OperatingExpenses","CapitalExpenses"].map((section) => (
        <Section
          key={section}
          title={section.replace(/([A-Z])/g, " $1").trim()}
          data={data[section]}
          onChange={(updated) => setData((prev) => ({ ...prev, [section]: updated }))}
        />
      ))}

      <TotalsBar label="EGI (Effective Gross Income)" value={egi} />
      <TotalsBar label="Gross Expenses" value={opx.grossAnnual} />
      <TotalsBar label="Net Operating Income" value={noi} />
      <TotalsBar label="Unlevered Free Cash Flow" value={unlevered} />
      <TotalsBar label="Leveraged Free Cash Flow" value={levered} />

      <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
        <button className="btn-save" onClick={() => exportCSV(data, propertyId)}>📊 Export CSV</button>
        <button className="btn-save" onClick={() => exportPDF(data, propertyId)}>📄 Export PDF</button>
      </div>
    </div>
  );
}
