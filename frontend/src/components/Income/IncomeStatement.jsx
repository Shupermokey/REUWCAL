// components/Income/IncomeStatement.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import toast from "react-hot-toast";

// 🔐 Providers
import { useAuth } from "@/app/providers/AuthProvider";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";

// 📊 Domain Logic
import {
  buildOperatingExpensesView,
  computeStatementTotals,
  extractMetricsFromRow,
  getLockedOpexKeys,
  sumSectionColumns,
} from "@/domain/incomeStatement.js";

// 🧩 Utils & Constants
import { SECTION_LAYOUT } from "@/utils/income/incomeSectionLayout.js";
import { newLeaf, defaultStructure } from "@/utils/income/incomeDefaults.js";

// 🔥 Firestore Service
import {
  getIncomeStatement,
  saveIncomeStatement,
} from "@/services/firestore/incomeStatementService.js";

// 🧱 Components
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section/Section.jsx";

// 🎨 Styles
import "@/styles/components/Income/IncomeStatement.css";




/* -------------------------------------------------------------------------- */
/* 💰 IncomeStatement Component                                               */
/* -------------------------------------------------------------------------- */

export default function IncomeStatement({
  rowData,
  propertyId,
  onSaveRowValue,
  onSaveRowToFirestore,
}) {
  const { user } = useAuth();
  const { groupedView } = useIncomeView();

  const [data, setData] = useState(defaultStructure);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const opexRef = useRef(null);

  // Derived helpers
  const metrics = useMemo(() => extractMetricsFromRow(rowData), [rowData]);
  const deriveGSR = useMemo(() => new Set(["Gross Scheduled Rent"]), []);
  const emptySet = useMemo(() => new Set(), []);
  const LOCKED_OPEX = useMemo(() => getLockedOpexKeys(), []);

  /* ------------------------------ Load Data --------------------------------- */
  useEffect(() => {
    if (!user || !propertyId) return;
    (async () => {
      try {
        const saved = await getIncomeStatement(user.uid, propertyId);
        setData(saved || defaultStructure);
        setLoaded(true);
      } catch (e) {
        console.error("Error loading income statement:", e);
        toast.error("Failed to load Income Statement");
      }
    })();
  }, [user, propertyId]);

  /* ---------------------- Optional Row → Income Injection -------------------- */
  useEffect(() => {
    if (!loaded || !rowData) return;
    const bri = rowData.bri ?? 0;
    setData((prev) => {
      const current = prev?.Income?.BRI?.grossAnnual ?? 0;
      if (current === bri) return prev; // no change → skip re-render
      const next = structuredClone(prev);
      if (!next.Income.BRI) next.Income.BRI = newLeaf();
      next.Income.BRI.grossAnnual = bri;
      return next;
    });
  }, [loaded, rowData?.bri]);

  /* -------------------------------- Save ------------------------------------ */
const onSave = async () => {
  if (!user || !propertyId) return;

  try {
    setSaving(true);
    setError(null);

    const totalIncome = await saveIncomeStatement(user.uid, propertyId, data);

    // Update row cell immediately (so it matches Firestore)
    onSaveRowValue?.(totalIncome);

    toast.success("✅ Saved Income Statement");
  } catch (err) {
    console.error("Save failed:", err);
    toast.error("❌ Save failed");
  } finally {
    setSaving(false);
  }
};


  /* ---------------------------- Handle Section Change ----------------------- */
  const handleSectionChange = (sectionKey) => (updatedSection) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: updatedSection,
    }));
  };

  /* -------------------------- Derived Operating Expenses -------------------- */
  const opexView = useMemo(
    () => buildOperatingExpensesView(data.OperatingExpenses || {}),
    [data.OperatingExpenses]
  );

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="income-wrapper">
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
              data={opexView}
              onChange={handleSectionChange(key)}
              enableSort
              lockKeys={LOCKED_OPEX}
              metrics={metrics}
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
            metrics={metrics}
            deriveKeys={key === "Income" ? deriveGSR : emptySet}
          />
        )
      )}
    </div>
    </div>
  );
}
