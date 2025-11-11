import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

// 🔐 Providers
import { useAuth } from "@/app/providers/AuthProvider";
import { useIncomeView } from "@/app/providers/IncomeViewProvider.jsx";

// 🧩 Utils & Constants
import { SECTION_LAYOUT } from "@/utils/income/incomeSectionLayout.js";
import { initializeSection } from "@/utils/income/incomeConfig.js";

// 🧱 Components
import HeaderBar from "./HeaderBar.jsx";
import Section from "./Section/Section.jsx";
import ValueColumns from "./Section/ValueColumns.jsx";

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
  const { displayMode } = useIncomeView();

  const { data, setData, loading, save } = useIncomeStatement(user.uid, propertyId);

  // Refs for scroll detection
  const panelRef = useRef(null);
  const sectionRefs = useRef({});

  // State for sticky section management
  const [stickySection, setStickySection] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());

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

  // Scroll detection to manage sticky sections
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleScroll = () => {
      const scrollTop = panel.scrollTop;
      const headerHeight = 56; // Income statement header height

      // Find which section should be sticky
      let newStickySection = null;
      let newCollapsed = new Set();

      SECTION_LAYOUT.forEach(({ sectionTitle }, index) => {
        const sectionEl = sectionRefs.current[sectionTitle];
        if (!sectionEl) return;

        const rect = sectionEl.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const relativeTop = rect.top - panelRect.top - headerHeight;

        // If section is scrolled past the sticky threshold
        // Make it sticky when the top is at or above the sticky position
        if (relativeTop <= 0) {
          // Check if this section is still visible
          const sectionBottom = rect.bottom - panelRect.top - headerHeight;
          if (sectionBottom > 0) {
            newStickySection = sectionTitle;
          }
        }
      });

      // Collapse all sections above the sticky section
      if (newStickySection) {
        const stickyIndex = SECTION_LAYOUT.findIndex(
          ({ sectionTitle }) => sectionTitle === newStickySection
        );
        for (let i = 0; i < stickyIndex; i++) {
          newCollapsed.add(SECTION_LAYOUT[i].sectionTitle);
        }
      }

      setStickySection(newStickySection);
      setCollapsedSections(newCollapsed);
    };

    panel.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => panel.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="income-wrapper">
        <div className="income-statement-panel">Loading Income Statement…</div>
      </div>
    );
  }

  // Get the sticky section info
  const stickySectionInfo = stickySection
    ? SECTION_LAYOUT.find(s => s.sectionTitle === stickySection)
    : null;

  return (
    <div className="income-wrapper">
      <div className="income-statement-panel" ref={panelRef} data-mode={displayMode}>
        <HeaderBar saving={loading} onSave={handleManualSave} />

        {/* Floating sticky section header */}
        {stickySectionInfo && (
          <div className="floating-section-header">
            <div className="floating-section-header__grid">
              <div className="floating-section-header__firstCell">
                <button
                  className="sec__caret"
                  onClick={() => {
                    setCollapsedSections(prev => {
                      const next = new Set(prev);
                      if (next.has(stickySection)) {
                        next.delete(stickySection);
                      } else {
                        next.add(stickySection);
                      }
                      return next;
                    });
                  }}
                  title={collapsedSections.has(stickySection) ? "Expand" : "Collapse"}
                >
                  {collapsedSections.has(stickySection) ? "▸" : "▾"}
                </button>
              </div>

              <div className="floating-section-header__label">
                <span className="sec__labelText">{stickySectionInfo.title}</span>
              </div>

              <div className="floating-section-header__values">
                <ValueColumns />
              </div>

              <div className="floating-section-header__actions">
                <button className="add-btn">
                  + Item
                </button>
              </div>
            </div>
          </div>
        )}

        {SECTION_LAYOUT.map(({ sectionTitle, title }) => (
          <Section
            key={sectionTitle}
            ref={(el) => {
              if (el) sectionRefs.current[sectionTitle] = el;
            }}
            title={title}
            sectionKey={sectionTitle}
            data={data?.[sectionTitle] || {}}
            onUpdateSection={(updatedData) => updateSection(sectionTitle, updatedData)}
            grossBuildingAreaSqFt={grossBuildingAreaSqFt}
            units={units}
            baselineData={baselineData}
            isSticky={stickySection === sectionTitle}
            isCollapsed={collapsedSections.has(sectionTitle)}
            onToggleCollapse={() => {
              setCollapsedSections(prev => {
                const next = new Set(prev);
                if (next.has(sectionTitle)) {
                  next.delete(sectionTitle);
                } else {
                  next.add(sectionTitle);
                }
                return next;
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}
