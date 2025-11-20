import React, { useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGrossSiteArea } from "@/hooks/useGrossSiteArea";
import {
  acresToSqFt,
  sqFtToAcres,
  roundArea,
  SQFT_PER_ACRE,
} from "@/utils/grossSiteArea/grossSiteAreaDefaults";
import AccountingInput from "@/components/common/AccountingInput";
import AccountingNumber from "@/components/common/AccountingNumber";
import "@/styles/components/GrossSiteArea/GrossSiteArea.css";

/**
 * GrossSiteArea Detail Panel
 */
export default function GrossSiteArea({ propertyId, acres, squareFeet }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = useGrossSiteArea(user.uid, propertyId);

  // Update field
  const updateField = useCallback(
    (field, value) => {
      setData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setData]
  );

  // Handle acres change - update square feet
  const handleAcresChange = useCallback(
    (value) => {
      const acres = typeof value === 'number' ? value : (parseFloat(value) || 0);
      const sqFt = roundArea(acresToSqFt(acres), false);

      setData((prev) => ({
        ...prev,
        acres,
        squareFeet: sqFt,
      }));
    },
    [setData]
  );

  // Handle square feet change - update acres
  const handleSquareFeetChange = useCallback(
    (value) => {
      const sqFt = typeof value === 'number' ? value : (parseFloat(value) || 0);
      const acres = roundArea(sqFtToAcres(sqFt), true);

      setData((prev) => ({
        ...prev,
        squareFeet: sqFt,
        acres,
      }));
    },
    [setData]
  );

  // Toggle primary unit
  const togglePrimaryUnit = useCallback(() => {
    setData((prev) => ({
      ...prev,
      primaryUnit: prev.primaryUnit === "acres" ? "squareFeet" : "acres",
    }));
  }, [setData]);

  // Handle save
  const handleSave = async () => {
    try {
      await save();
      toast.success("✅ Gross Site Area saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="gross-site-area-wrapper">
        <div className="gross-site-area-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const isPrimaryAcres = data.primaryUnit === "acres";

  return (
    <div className="gross-site-area-wrapper">
      <div className="gross-site-area-panel">
        {/* Header */}
        <div className="gsa-header">
          <h2>Gross Site Area</h2>
          <button className="gsa-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Area Measurements Section */}
        <section className="gsa-section">
          <div className="gsa-section-header">
            <h3>Area Measurements</h3>
            <button className="gsa-toggle-btn" onClick={togglePrimaryUnit} title="Switch primary unit">
              {isPrimaryAcres ? "📐 Primary: Acres" : "📐 Primary: Sq Ft"}
            </button>
          </div>

          <div className="gsa-conversion-info">
            <span className="gsa-info-label">Conversion:</span>
            <span className="gsa-info-value">1 Acre = {SQFT_PER_ACRE.toLocaleString()} Sq Ft</span>
          </div>

          <div className="gsa-fields-grid">
            {/* Acres Field */}
            <div className={`gsa-field ${isPrimaryAcres ? "gsa-field-primary" : ""}`}>
              <label>
                Acres {isPrimaryAcres && <span className="gsa-primary-badge">Primary</span>}
              </label>
              <AccountingInput
                value={data.acres}
                onChange={(val) => handleAcresChange(val)}
                placeholder="0.0000"
                decimals={4}
                symbolType="acres"
              />
              <p className="gsa-field-hint">
                {isPrimaryAcres ? "Enter acres, auto-calculates sq ft" : "Auto-calculated from sq ft"}
              </p>
            </div>

            {/* Square Feet Field */}
            <div className={`gsa-field ${!isPrimaryAcres ? "gsa-field-primary" : ""}`}>
              <label>
                Square Feet {!isPrimaryAcres && <span className="gsa-primary-badge">Primary</span>}
              </label>
              <AccountingInput
                value={data.squareFeet}
                onChange={(val) => handleSquareFeetChange(val)}
                placeholder="0.00"
                decimals={2}
                symbolType="sqft"
              />
              <p className="gsa-field-hint">
                {!isPrimaryAcres ? "Enter sq ft, auto-calculates acres" : "Auto-calculated from acres"}
              </p>
            </div>
          </div>

          <div className="gsa-summary">
            <div className="gsa-summary-item">
              <span className="gsa-summary-label">Total Area:</span>
              <span className="gsa-summary-value">
                <AccountingNumber value={data.acres} decimals={4} symbolType="acres" /> (<AccountingNumber value={data.squareFeet} decimals={0} symbolType="sqft" />)
              </span>
            </div>
          </div>
        </section>

        {/* Property Survey Section */}
        <section className="gsa-section">
          <h3>Documentation</h3>

          <div className="gsa-folder-card">
            <h4>📁 Property Survey</h4>
            <p>Property survey documents, plat maps, and boundary information</p>
          </div>
        </section>
      </div>
    </div>
  );
}
