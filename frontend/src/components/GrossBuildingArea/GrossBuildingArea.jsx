import React, { useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGrossBuildingArea } from "@/hooks/useGrossBuildingArea";
import "@/styles/components/GrossBuildingArea/GrossBuildingArea.css";

/**
 * GrossBuildingArea Detail Panel
 */
export default function GrossBuildingArea({ propertyId }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = useGrossBuildingArea(user.uid, propertyId);

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

  // Handle save
  const handleSave = async () => {
    try {
      await save();
      toast.success("✅ Gross Building Area saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="gross-building-area-wrapper">
        <div className="gross-building-area-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="gross-building-area-wrapper">
      <div className="gross-building-area-panel">
        {/* Header */}
        <div className="gba-header">
          <h2>Gross Building Area</h2>
          <button className="gba-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Area Measurements Section */}
        <section className="gba-section">
          <h3>Area Measurements</h3>

          <div className="gba-fields-grid">
            {/* GBA Field - Required */}
            <div className="gba-field gba-field-primary">
              <label>
                Gross Building Area (GBA) <span className="gba-required-badge">Required</span>
              </label>
              <input
                type="number"
                value={data.gba}
                onChange={(e) => updateField("gba", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="gba-field-hint">Total building area including all floors and common spaces</p>
            </div>

            {/* GLA Field */}
            <div className="gba-field">
              <label>Gross Living Area (GLA)</label>
              <input
                type="number"
                value={data.gla}
                onChange={(e) => updateField("gla", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="gba-field-hint">Finished living space in residential properties</p>
            </div>

            {/* NRA Field */}
            <div className="gba-field">
              <label>Net Rentable Area (NRA)</label>
              <input
                type="number"
                value={data.nra}
                onChange={(e) => updateField("nra", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="gba-field-hint">Actual rentable space excluding common areas</p>
            </div>
          </div>

          {/* Summary */}
          <div className="gba-summary">
            <div className="gba-summary-item">
              <span className="gba-summary-label">Total GBA:</span>
              <span className="gba-summary-value">{data.gba.toLocaleString()} sq ft</span>
            </div>
            {data.gla > 0 && (
              <div className="gba-summary-item">
                <span className="gba-summary-label">GLA:</span>
                <span className="gba-summary-value">{data.gla.toLocaleString()} sq ft</span>
              </div>
            )}
            {data.nra > 0 && (
              <div className="gba-summary-item">
                <span className="gba-summary-label">NRA:</span>
                <span className="gba-summary-value">{data.nra.toLocaleString()} sq ft</span>
              </div>
            )}
          </div>
        </section>

        {/* Documentation Section */}
        <section className="gba-section">
          <h3>Documentation</h3>

          <div className="gba-folders-grid">
            <div className="gba-folder-card">
              <h4>📐 Floor Plans</h4>
              <p>Architectural floor plans, layouts, and building drawings</p>
            </div>

            <div className="gba-folder-card">
              <h4>📁 Other</h4>
              <p>Additional building documentation and related files</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
