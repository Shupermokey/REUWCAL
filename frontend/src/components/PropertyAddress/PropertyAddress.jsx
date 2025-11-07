import React, { useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePropertyAddress } from "@/hooks/usePropertyAddress";
import {
  ZONING_CATEGORIES,
  COMMERCIAL_SUBTYPES,
  RESIDENTIAL_SUBTYPES,
} from "@/utils/propertyAddress/propertyAddressDefaults";
import "@/styles/components/PropertyAddress/PropertyAddress.css";

/**
 * PropertyAddress Detail Panel
 */
export default function PropertyAddress({ propertyId }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = usePropertyAddress(user.uid, propertyId);

  // Update field
  const updateField = useCallback(
    (path, value) => {
      setData((prev) => {
        const updated = { ...prev };
        const keys = path.split(".");
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        return updated;
      });
    },
    [setData]
  );

  // Handle zoning category change
  const handleZoningCategoryChange = useCallback(
    (category) => {
      updateField("zoning.category", category);
      // Set default subtype based on category
      const defaultSubtype =
        category === ZONING_CATEGORIES.COMMERCIAL
          ? COMMERCIAL_SUBTYPES[0]
          : RESIDENTIAL_SUBTYPES[0];
      updateField("zoning.subtype", defaultSubtype);
      updateField("zoning.customSubtype", "");
    },
    [updateField]
  );

  // Handle save
  const handleSave = async () => {
    try {
      await save();
      toast.success("✅ Property Address saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="property-address-wrapper">
        <div className="property-address-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const zoningSubtypes =
    data.zoning.category === ZONING_CATEGORIES.COMMERCIAL
      ? COMMERCIAL_SUBTYPES
      : RESIDENTIAL_SUBTYPES;

  const isOtherSubtype = data.zoning.subtype === "OTHER";

  return (
    <div className="property-address-wrapper">
      <div className="property-address-panel">
        {/* Header */}
        <div className="pa-header">
          <h2>Property Address & Details</h2>
          <button className="pa-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Basic Info Section */}
        <section className="pa-section">
          <h3>Basic Information</h3>
          <div className="pa-field">
            <label>
              Property Address <span className="required">*</span>
            </label>
            <input
              type="text"
              value={data.propertyAddress}
              onChange={(e) => updateField("propertyAddress", e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              required
            />
          </div>

          <div className="pa-field">
            <label>Property Title</label>
            <input
              type="text"
              value={data.propertyTitle}
              onChange={(e) => updateField("propertyTitle", e.target.value)}
              placeholder="Optional property title"
            />
          </div>
        </section>

        {/* Zoning Section */}
        <section className="pa-section">
          <h3>Property Zoning</h3>

          {/* Zoning Category */}
          <div className="pa-field">
            <label>Zoning Category</label>
            <div className="pa-radio-group">
              {Object.values(ZONING_CATEGORIES).map((category) => (
                <button
                  key={category}
                  className={`pa-radio-btn ${
                    data.zoning.category === category ? "active" : ""
                  }`}
                  onClick={() => handleZoningCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Zoning Subtype */}
          <div className="pa-field">
            <label>Zoning Subtype</label>
            <select
              value={data.zoning.subtype}
              onChange={(e) => updateField("zoning.subtype", e.target.value)}
            >
              {zoningSubtypes.map((subtype) => (
                <option key={subtype} value={subtype}>
                  {subtype}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Subtype (if OTHER) */}
          {isOtherSubtype && (
            <div className="pa-field">
              <label>Custom Zoning Subtype</label>
              <input
                type="text"
                value={data.zoning.customSubtype}
                onChange={(e) =>
                  updateField("zoning.customSubtype", e.target.value)
                }
                placeholder="Enter custom subtype"
              />
            </div>
          )}

          {/* Zoning Code */}
          <div className="pa-field">
            <label>Zoning Code</label>
            <input
              type="text"
              value={data.zoning.code}
              onChange={(e) => updateField("zoning.code", e.target.value)}
              placeholder="e.g., R-1, C-2"
            />
          </div>

          {/* Folder placeholders */}
          <div className="pa-folder-section">
            <h4>📁 Zoning Map</h4>
            <p className="pa-folder-placeholder">
              PDF uploads and links coming soon
            </p>
          </div>

          <div className="pa-folder-section">
            <h4>📁 Zoning Ordinance</h4>
            <p className="pa-folder-placeholder">
              PDF uploads and links coming soon
            </p>
          </div>
        </section>

        {/* Flood Zone Section */}
        <section className="pa-section">
          <h3>Flood Zone (FEMA)</h3>

          <div className="pa-field">
            <label>FEMA ID</label>
            <input
              type="text"
              value={data.floodZone.femaId}
              onChange={(e) => updateField("floodZone.femaId", e.target.value)}
              placeholder="FEMA ID"
            />
          </div>

          <div className="pa-field">
            <label>Tile ID</label>
            <input
              type="text"
              value={data.floodZone.tileId}
              onChange={(e) => updateField("floodZone.tileId", e.target.value)}
              placeholder="Tile ID"
            />
          </div>

          <div className="pa-field">
            <label>Date of Generation</label>
            <input
              type="date"
              value={data.floodZone.dateOfGeneration}
              onChange={(e) =>
                updateField("floodZone.dateOfGeneration", e.target.value)
              }
            />
          </div>

          <div className="pa-folder-section">
            <h4>📁 FEMA Documentation</h4>
            <p className="pa-folder-placeholder">
              PDF uploads and links coming soon
            </p>
          </div>
        </section>

        {/* Additional Documentation */}
        <section className="pa-section">
          <h3>Additional Documentation</h3>

          <div className="pa-folders-grid">
            <div className="pa-folder-card">
              <h4>📁 Marketing / Media</h4>
              <p>Offering memorandum, marketing materials</p>
            </div>

            <div className="pa-folder-card">
              <h4>📁 MSA / Trade Area Report</h4>
              <p>Metropolitan Statistical Area reports</p>
            </div>

            <div className="pa-folder-card">
              <h4>📁 Demographics</h4>
              <p>Demographic studies and data</p>
            </div>

            <div className="pa-folder-card">
              <h4>📁 Traffic Patterns</h4>
              <p>Traffic studies and patterns</p>
            </div>

            <div className="pa-folder-card">
              <h4>📁 Property Reports / Inspections</h4>
              <p>Inspection reports, appraisals</p>
            </div>

            <div className="pa-folder-card">
              <h4>📁 Corporate Governance</h4>
              <p>Corporate governance documents</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
