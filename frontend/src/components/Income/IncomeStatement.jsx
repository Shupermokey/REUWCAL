// components/Income/IncomeStatement.jsx
import React, { useMemo } from "react";
import toast from "react-hot-toast";

// 🔐 Providers
import { useAuth } from "@/app/providers/AuthProvider";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useTable } from "@/app/providers/TableProvider.jsx";
import { useIncomeStatement } from "@/hooks/useIncomeStatement.js";

// 📊 Domain Logic
import { extractMetricsFromRow } from "@/domain/incomeStatement.js";

// 🧩 Utils & Constants
import { SECTION_LAYOUT } from "@/utils/income/incomeSectionLayout.js";
import { defaultStructure } from "@/utils/income/incomeDefaults.js";

// 🧱 Components
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section/Section.jsx";

// 🎨 Styles
import "@/styles/components/Income/IncomeStatement.css";

/* -------------------------------------------------------------------------- */
/* 💰 IncomeStatement Component (refactored for 3-layer pattern)              */

export default function IncomeStatement({ rowData, propertyId }) {
  const { user } = useAuth();
  const { updateRowCell } = useTable();
  const { groupedView } = useIncomeView();

  // 🧠 Centralized hook for Firestore fetch + save
  const { data, setData, save, update, loading } = useIncomeStatement(
    user?.uid,
    propertyId
  );

  const metrics = useMemo(() => extractMetricsFromRow(rowData), [rowData]);

  // 🧩 Local wrapper to update one section (Income / OpEx / CapEx)
  const handleSectionChange = (sectionKey) => (updatedSection) => {
    const updated = { ...data, [sectionKey]: structuredClone(updatedSection) };
    setData(updated);
    //save(updated);
  };

  // 🧮 Manual Save button handler
  const handleManualSave = async () => {
    try {
      await save(data);
      updateRowCell(propertyId, "incomeStatement", {
        value: "Updated",
        details: {
          source: "IncomeStatement",
          lastSyncedAt: new Date().toISOString(),
        },
      });
      toast.success("✅ Saved Income Statement");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading)
    return (
      <div className="income-wrapper">
        <div className="income-statement-panel">Loading Income Statement…</div>
      </div>
    );

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="income-wrapper">
      <div className="income-statement-panel">
        <HeaderBar onSave={handleManualSave} />

        {SECTION_LAYOUT.map(({ sectionTitle, title }) => (
          <Section
            key={sectionTitle}
            title={title}
            data={data[sectionTitle]}
            onAutoSave={async (updated) => {
              await save(updated);
            }}
            onChange={handleSectionChange(sectionTitle)}
            metrics={metrics}
            sectionTitle={sectionTitle}
            fullData={data}
          />
        ))}
      </div>
    </div>
  );
}
