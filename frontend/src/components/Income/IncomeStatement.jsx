import React, { useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";

// 🔐 Providers
import { useAuth } from "@/app/providers/AuthProvider";

// 🧩 Utils & Constants
import { SECTION_LAYOUT } from "@/utils/income/incomeSectionLayout.js";
import { initializeSection } from "@/utils/income/incomeConfig.js";

// 🧱 Components
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section/Section.jsx";

// 🎨 Styles
import "@/styles/components/Income/IncomeStatement.css";
import { useIncomeStatement } from "@/hooks/useIncomeStatement.js";


/* -------------------------------------------------------------------------- */
/* 💼 IncomeStatement (Context-based core component)                          */
/* -------------------------------------------------------------------------- */
export default function IncomeStatement({
  propertyId,
  grossBuildingAreaSqFt = 0,
  units = 0,
  baselineData = null,
}) {
  const { user } = useAuth();

  const { data, setData, loading, save } = useIncomeStatement(user.uid, propertyId);

  // Initialize sections if they're empty
  useEffect(() => {
    if (!loading && data) {
      let needsInit = false;
      const updated = { ...data };

      SECTION_LAYOUT.forEach(({ sectionTitle }) => {
        if (!updated[sectionTitle] || !updated[sectionTitle].order) {
          updated[sectionTitle] = initializeSection(sectionTitle);
          needsInit = true;
        }
      });

      if (needsInit) {
        setData(updated);
      }
    }
  }, [data, loading, setData]);

  // Update a specific section
  const updateSection = useCallback(
    (sectionKey, updatedSectionData) => {
      setData((prev) => ({
        ...prev,
        [sectionKey]: updatedSectionData,
      }));
    },
    [setData]
  );

  const handleManualSave = async () => {
    try {
      console.log("Saving Income Statement...");
      await save();
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
        <HeaderBar saving={loading} onSave={handleManualSave} />

        {SECTION_LAYOUT.map(({ sectionTitle, title }) => (
          <Section
            key={sectionTitle}
            title={title}
            sectionKey={sectionTitle}
            data={data?.[sectionTitle] || {}}
            onUpdateSection={(updatedData) => updateSection(sectionTitle, updatedData)}
            grossBuildingAreaSqFt={grossBuildingAreaSqFt}
            units={units}
            baselineData={baselineData}
          />
        ))}
      </div>
    </div>
  );
}
