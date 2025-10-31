import React, { useEffect, useRef, useState, useMemo } from "react";
import toast from "react-hot-toast";

// 🔐 Providers
import { useAuth } from "@/app/providers/AuthProvider";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useTable } from "@/app/providers/TableProvider.jsx";

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
import {
  FIXED_DIVIDER_INCOME_KEY,
  FIXED_FIRST_INCOME_KEY,
  INCOME_ORDER,
} from "@/constants/incomeKeys.js";

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

export default function IncomeStatement({ rowData, propertyId }) {
  const { user } = useAuth();
  const { groupedView } = useIncomeView();
  const { updateRowCell, saveRowToFirestore } = useTable();

  const [data, setData] = useState(defaultStructure);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const opexRef = useRef(null);

  /* ----------------------------- Derived helpers ---------------------------- */
  const metrics = useMemo(() => extractMetricsFromRow(rowData), [rowData]);

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

          // predefined order first
          INCOME_ORDER.forEach((k) => {
            if (incomeKeys.includes(k)) orderedIncome[k] = saved.Income[k];
          });

          // then any user-added keys
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

  /* --------------------- Keep GSR always first in order ---------------------- */
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

  /* -------------------- Normalize Income section before save ----------------- */
  function normalizeIncomeData(rawIncome) {
    if (!rawIncome) return {};
    const ordered = {};

    // enforce canonical order
    INCOME_ORDER.forEach((k) => {
      if (rawIncome[k]) ordered[k] = structuredClone(rawIncome[k]);
    });

    // append user-added keys
    Object.keys(rawIncome)
      .filter((k) => !INCOME_ORDER.includes(k))
      .forEach((k) => (ordered[k] = structuredClone(rawIncome[k])));

    // enforce sign rules
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

      // Normalize data before saving
      const normalized = {
        ...data,
        Income: normalizeIncomeData(data?.Income || {}),
      };

      // Save to Firestore and compute total
      const totalIncome = await saveIncomeStatement(
        user.uid,
        propertyId,
        normalized
      );

      // 🔹 Update the parent table's IncomeStatement cell
      const updatedCell = {
        value: totalIncome,
        details: {
          source: "IncomeStatement",
          lastSyncedAt: new Date().toISOString(),
        },
      };
      updateRowCell(propertyId, "incomeStatement", updatedCell);

      toast.success("✅ Saved Income Statement");
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Save failed:", err);
      setError(err);
      toast.error("❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------ Manual Save to Firestore ------------------------ */
  const handleSaveToFirestore = async () => {
    try {
      await saveRowToFirestore(propertyId);
      toast.success("✅ Row synced to Firestore");
    } catch (err) {
      toast.error("❌ Failed to sync row");
      console.error(err);
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

        {SECTION_LAYOUT.map(
          ({ key, title }) => (
            <Section
              key={key}
              title={title} // Operating Income | Operating Expenses | Capital Expenses
              data={data[key]} //defaultStructure.Income | .OperatingExpenses | .CapitalExpenses
              onChange={handleSectionChange(key)}
              metrics={metrics}
              fullPrefix={key} // Income | OperatingExpenses | CapitalExpenses
            />
          )
          // )
        )}
      </div>
    </div>
  );
}
