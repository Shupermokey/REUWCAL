import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePropertyTaxes } from "@/hooks/usePropertyTaxes";
import {
  parseTaxPins,
  formatTaxPins,
} from "@/utils/propertyTaxes/propertyTaxesDefaults";
import "@/styles/components/PropertyTaxes/PropertyTaxes.css";

/**
 * PropertyTaxes Detail Panel
 */
export default function PropertyTaxes({ propertyId, currentTaxAmount }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = usePropertyTaxes(user.uid, propertyId);

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

  // Tax PINs as string for display
  const taxPinsString = useMemo(() => {
    if (!data?.taxPins) return "";
    return formatTaxPins(data.taxPins);
  }, [data?.taxPins]);

  // Handle tax PINs change
  const handleTaxPinsChange = useCallback(
    (value) => {
      const pinsArray = parseTaxPins(value);
      updateField("taxPins", pinsArray);
    },
    [updateField]
  );

  // Auto-calculate total from country + municipal
  const handleTaxBreakdownChange = useCallback(
    (field, value) => {
      const numValue = parseFloat(value) || 0;
      updateField(`taxAmount.${field}`, numValue);

      // Auto-update total
      setData((prev) => {
        const country = field === "country" ? numValue : prev.taxAmount.country;
        const municipal = field === "municipal" ? numValue : prev.taxAmount.municipal;
        return {
          ...prev,
          taxAmount: {
            ...prev.taxAmount,
            [field]: numValue,
            total: country + municipal,
          },
        };
      });
    },
    [updateField, setData]
  );

  // Handle total change - distribute to country and municipal proportionally
  const handleTotalChange = useCallback(
    (value) => {
      const numValue = parseFloat(value) || 0;
      updateField("taxAmount.total", numValue);

      // If country and municipal are both 0, split 50/50
      if (data.taxAmount.country === 0 && data.taxAmount.municipal === 0) {
        const half = numValue / 2;
        setData((prev) => ({
          ...prev,
          taxAmount: {
            total: numValue,
            country: half,
            municipal: half,
          },
        }));
      } else {
        // Distribute proportionally
        const currentTotal = data.taxAmount.country + data.taxAmount.municipal;
        if (currentTotal > 0) {
          const countryRatio = data.taxAmount.country / currentTotal;
          const municipalRatio = data.taxAmount.municipal / currentTotal;

          setData((prev) => ({
            ...prev,
            taxAmount: {
              total: numValue,
              country: numValue * countryRatio,
              municipal: numValue * municipalRatio,
            },
          }));
        }
      }
    },
    [data, updateField, setData]
  );

  // Handle save
  const handleSave = async () => {
    try {
      await save();
      toast.success("✅ Property Taxes saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="property-taxes-wrapper">
        <div className="property-taxes-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="property-taxes-wrapper">
      <div className="property-taxes-panel">
        {/* Header */}
        <div className="pt-header">
          <h2>Property Taxes</h2>
          <button className="pt-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Tax PINs Section */}
        <section className="pt-section">
          <h3>Tax Identification</h3>
          <div className="pt-field">
            <label>Tax PIN(s)</label>
            <input
              type="text"
              value={taxPinsString}
              onChange={(e) => handleTaxPinsChange(e.target.value)}
              placeholder="1234; 5678; 9012 (separate multiple PINs with semicolons)"
            />
            <p className="pt-field-hint">
              Enter multiple PINs separated by semicolons (;)
            </p>
          </div>

          {data.taxPins.length > 0 && (
            <div className="pt-pins-list">
              <p className="pt-pins-label">Tax PINs ({data.taxPins.length}):</p>
              <div className="pt-pins-chips">
                {data.taxPins.map((pin, index) => (
                  <span key={index} className="pt-pin-chip">
                    {pin}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Tax Amount Section */}
        <section className="pt-section">
          <h3>Tax Amount</h3>

          <div className="pt-field">
            <label>
              Total Tax Amount <span className="required">*</span>
            </label>
            <div className="pt-input-group">
              <span className="pt-input-prefix">$</span>
              <input
                type="number"
                value={data.taxAmount.total}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="pt-breakdown">
            <h4>Tax Breakdown</h4>
            <div className="pt-breakdown-grid">
              <div className="pt-field">
                <label>Country Tax</label>
                <div className="pt-input-group">
                  <span className="pt-input-prefix">$</span>
                  <input
                    type="number"
                    value={data.taxAmount.country}
                    onChange={(e) => handleTaxBreakdownChange("country", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="pt-field">
                <label>Municipal Tax</label>
                <div className="pt-input-group">
                  <span className="pt-input-prefix">$</span>
                  <input
                    type="number"
                    value={data.taxAmount.municipal}
                    onChange={(e) => handleTaxBreakdownChange("municipal", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Size Section */}
        <section className="pt-section">
          <h3>Property Size</h3>
          <div className="pt-field">
            <label>Size (Square Feet)</label>
            <input
              type="number"
              value={data.size}
              onChange={(e) => updateField("size", parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="1"
            />
            <p className="pt-field-hint">
              Portions that add up to Gross Site Area (GSA)
            </p>
          </div>
        </section>

        {/* Documentation Folders */}
        <section className="pt-section">
          <h3>Documentation</h3>

          <div className="pt-folders-grid">
            <div className="pt-folder-card">
              <h4>📁 Assessment</h4>
              <p>Property tax assessment documents</p>
            </div>

            <div className="pt-folder-card">
              <h4>📁 Property Report</h4>
              <p>Property inspection and evaluation reports</p>
            </div>

            <div className="pt-folder-card">
              <h4>📁 Tax Bill</h4>
              <p>Current tax bills and payment history</p>
            </div>

            <div className="pt-folder-card">
              <h4>📁 Potential Tax Bills</h4>
              <p>Future or projected tax assessments</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
