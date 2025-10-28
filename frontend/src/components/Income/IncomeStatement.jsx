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
import { FIXED_DIVIDER_INCOME_KEY, FIXED_FIRST_INCOME_KEY } from "@/constants/incomeKeys.js";
import { INCOME_ORDER } from "@/constants/incomeKeys.js";

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
        if (saved) {
          // --- enforce deterministic order ---
          const orderedIncome = {};
          const incomeKeys = Object.keys(saved.Income || {});

          // first, use predefined order
          INCOME_ORDER.forEach((k) => {
            if (incomeKeys.includes(k)) orderedIncome[k] = saved.Income[k];
          });

          // then append any user-added keys (preserve their values)
          incomeKeys
            .filter((k) => !INCOME_ORDER.includes(k))
            .forEach((k) => (orderedIncome[k] = saved.Income[k]));

          const normalized = { ...saved, Income: orderedIncome };
          setData(normalized);
        } else {
          setData(defaultStructure);
        }
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

  useEffect(() => {
    setData((prev) => {
      const inc = prev?.Income || {};
      if (!inc[FIXED_FIRST_INCOME_KEY]) return prev;

      const reordered = {
        [FIXED_FIRST_INCOME_KEY]: inc[FIXED_FIRST_INCOME_KEY],
        ...Object.fromEntries(
          Object.entries(inc).filter(([k]) => k !== FIXED_FIRST_INCOME_KEY)
        ),
      };
      return { ...prev, Income: reordered };
    });
  }, [loaded]);

  // Normalize Income section before persisting
  function normalizeIncomeData(rawIncome) {
    if (!rawIncome) return {};
    const ordered = {};

    // enforce canonical order first
    INCOME_ORDER.forEach((k) => {
      if (rawIncome[k]) ordered[k] = structuredClone(rawIncome[k]);
    });

    // include any user-added keys (in current insertion order)
    Object.keys(rawIncome)
      .filter((k) => !INCOME_ORDER.includes(k))
      .forEach((k) => (ordered[k] = structuredClone(rawIncome[k])));

    // enforce signs
    const gsrIndex = INCOME_ORDER.indexOf(FIXED_FIRST_INCOME_KEY);
    const nriIndex = INCOME_ORDER.indexOf(FIXED_DIVIDER_INCOME_KEY);
    Object.entries(ordered).forEach(([k, v]) => {
      const idx = INCOME_ORDER.indexOf(k);
      if (idx > gsrIndex && idx < nriIndex) {
        for (const key in v)
          if (typeof v[key] === "number" && v[key] > 0) v[key] = -v[key];
      }
      if (idx > nriIndex) {
        for (const key in v)
          if (typeof v[key] === "number" && v[key] < 0)
            v[key] = Math.abs(v[key]);
      }
    });

    return ordered;
  }

  /* -------------------------------- Save ------------------------------------ */
  const onSave = async () => {
    if (!user || !propertyId) return;
    try {
      setSaving(true);
      setError(null);

      // 🔹 Normalize first
      const normalized = {
        ...data,
        Income: normalizeIncomeData(data?.Income || {}),
      };

      const totalIncome = await saveIncomeStatement(
        user.uid,
        propertyId,
        normalized
      );
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
              fullPrefix={key}
            />
          )
        )}
      </div>
    </div>
  );
}
