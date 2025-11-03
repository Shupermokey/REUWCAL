import React, { useEffect, useMemo } from "react";
import toast from "react-hot-toast";

// 🔐 Providers
import { useAuth } from "@/app/providers/AuthProvider";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";
import { useTable } from "@/app/providers/TableProvider.jsx";
import { IncomeProvider, useIncome } from "@/app/providers/IncomeProvider.jsx";

// 📊 Domain Logic
import { extractMetricsFromRow } from "@/domain/incomeStatement.js";

// 🧩 Utils & Constants
import { SECTION_LAYOUT } from "@/utils/income/incomeSectionLayout.js";

// 🧱 Components
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section/Section.jsx";

// 🎨 Styles
import "@/styles/components/Income/IncomeStatement.css";
import { sortIncomeSection } from "@/constants/sortSection.js";

/* -------------------------------------------------------------------------- */
/* 💰 IncomeStatement (Provider wrapper)                                      */
/* -------------------------------------------------------------------------- */
// This is the entrypoint used by the rest of your app.
export default function IncomeStatementWrapper({ rowData, propertyId }) {
  const { user } = useAuth();
  const metrics = useMemo(() => extractMetricsFromRow(rowData), [rowData]);

  if (!user?.uid || !propertyId)
    return <div>Missing user or property context.</div>;

  return (
    <IncomeProvider userId={user.uid} propertyId={propertyId}>
      <IncomeStatement metrics={metrics} propertyId={propertyId} />
    </IncomeProvider>
  );
}

/* -------------------------------------------------------------------------- */
/* 💼 IncomeStatement (Context-based core component)                          */
/* -------------------------------------------------------------------------- */
function IncomeStatement({ metrics, propertyId }) {
  const { updateRowCell } = useTable();
  const { displayMode } = useIncomeView();
  const { data, setData, save, loading, dirty } = useIncome();

  useEffect(() => {
    if (!loading && data?.Income) {
      const sorted = sortIncomeSection(data.Income);
      if (JSON.stringify(sorted) !== JSON.stringify(data.Income)) {
        const newData = { ...data, Income: sorted };
        setData(newData); // ✅ forces re-render
      }
    }
  }, [loading, data, setData]);

  const handleManualSave = async () => {
    try {
      console.log("Saving Income Statement...");
      if (data?.Income) {
        data.Income = sortIncomeSection(data.Income);
      }
      await save();
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

  if (loading) {
    return (
      <div className="income-wrapper">
        <div className="income-statement-panel">Loading Income Statement…</div>
      </div>
    );
  }

  return (
    <div className="income-wrapper">
      <div className="income-statement-panel">
        <HeaderBar onSave={handleManualSave} dirty={dirty} />

        {SECTION_LAYOUT.map(({ sectionTitle, title }) => (
          <Section
            key={sectionTitle}
            title={title}
            sectionKey={sectionTitle}
            data={data?.[sectionTitle] || {}}
            displayMode={displayMode}
            metrics={metrics}
          />
        ))}
      </div>
    </div>
  );
}
