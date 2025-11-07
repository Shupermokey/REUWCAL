import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { useUnits } from "@/hooks/useUnits";
import {
  createUnitType,
  calculateTotalUnits,
  calculateAvgSqFt,
  calculateAvgRent,
} from "@/utils/units/unitsDefaults";
import "@/styles/components/Units/Units.css";

/**
 * Units Detail Panel
 */
export default function Units({ propertyId }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = useUnits(user.uid, propertyId);

  // Calculate totals
  const totals = useMemo(() => {
    if (!data?.unitMix) return { totalUnits: 0, avgSqFt: 0, avgRent: 0 };

    return {
      totalUnits: calculateTotalUnits(data.unitMix),
      avgSqFt: calculateAvgSqFt(data.unitMix),
      avgRent: calculateAvgRent(data.unitMix),
    };
  }, [data?.unitMix]);

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

  // Update unit mix item
  const updateUnitMixItem = useCallback(
    (index, field, value) => {
      setData((prev) => {
        const newUnitMix = [...prev.unitMix];
        newUnitMix[index] = {
          ...newUnitMix[index],
          [field]: value,
        };
        return {
          ...prev,
          unitMix: newUnitMix,
        };
      });
    },
    [setData]
  );

  // Add unit type
  const addUnitType = useCallback(() => {
    setData((prev) => ({
      ...prev,
      unitMix: [...prev.unitMix, createUnitType()],
    }));
  }, [setData]);

  // Remove unit type
  const removeUnitType = useCallback(
    (index) => {
      setData((prev) => ({
        ...prev,
        unitMix: prev.unitMix.filter((_, i) => i !== index),
      }));
    },
    [setData]
  );

  // Handle save
  const handleSave = async () => {
    try {
      await save();
      toast.success("✅ Units saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="units-wrapper">
        <div className="units-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="units-wrapper">
      <div className="units-panel">
        {/* Header */}
        <div className="units-header">
          <h2>Units</h2>
          <button className="units-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Unit Mix Section */}
        <section className="units-section">
          <div className="units-section-header">
            <h3>Unit Mix</h3>
            <button className="units-add-btn" onClick={addUnitType}>
              ➕ Add Unit Type
            </button>
          </div>

          <div className="units-mix-grid">
            {data.unitMix.map((unit, index) => (
              <div key={index} className="units-mix-card">
                <div className="units-mix-card-header">
                  <span className="units-mix-card-number">#{index + 1}</span>
                  {data.unitMix.length > 1 && (
                    <button
                      className="units-remove-btn"
                      onClick={() => removeUnitType(index)}
                      title="Remove unit type"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="units-mix-fields">
                  <div className="units-field">
                    <label>Unit Type</label>
                    <input
                      type="text"
                      value={unit.unitType}
                      onChange={(e) => updateUnitMixItem(index, "unitType", e.target.value)}
                      placeholder="e.g., Studio, 1BR, 2BR"
                    />
                  </div>

                  <div className="units-field">
                    <label>Count</label>
                    <input
                      type="number"
                      value={unit.count}
                      onChange={(e) => updateUnitMixItem(index, "count", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="units-field">
                    <label>Avg Sq Ft</label>
                    <input
                      type="number"
                      value={unit.avgSqFt}
                      onChange={(e) => updateUnitMixItem(index, "avgSqFt", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="units-field">
                    <label>Avg Rent ($/mo)</label>
                    <input
                      type="number"
                      value={unit.avgRent}
                      onChange={(e) => updateUnitMixItem(index, "avgRent", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Unit Summary */}
                {unit.count > 0 && (
                  <div className="units-mix-summary">
                    <span className="units-mix-summary-text">
                      {unit.count} {unit.unitType || "unit"}
                      {unit.count > 1 ? "s" : ""}
                      {unit.avgSqFt > 0 && ` · ${unit.avgSqFt.toLocaleString()} sq ft avg`}
                      {unit.avgRent > 0 && ` · $${unit.avgRent.toLocaleString()}/mo avg`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="units-totals">
            <div className="units-totals-item">
              <span className="units-totals-label">Total Units:</span>
              <span className="units-totals-value">{totals.totalUnits}</span>
            </div>
            {totals.avgSqFt > 0 && (
              <div className="units-totals-item">
                <span className="units-totals-label">Weighted Avg Sq Ft:</span>
                <span className="units-totals-value">{totals.avgSqFt.toLocaleString()} sq ft</span>
              </div>
            )}
            {totals.avgRent > 0 && (
              <div className="units-totals-item">
                <span className="units-totals-label">Weighted Avg Rent:</span>
                <span className="units-totals-value">${totals.avgRent.toLocaleString()}/mo</span>
              </div>
            )}
          </div>
        </section>

        {/* Rent Roll Section */}
        <section className="units-section">
          <h3>Rent Roll Summary</h3>

          <div className="units-rentroll-grid">
            <div className="units-field">
              <label>Total Monthly Rent</label>
              <input
                type="number"
                value={data.rentRoll.totalMonthlyRent}
                onChange={(e) =>
                  updateField("rentRoll", {
                    ...data.rentRoll,
                    totalMonthlyRent: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="units-field-hint">Total monthly rent collected from all units</p>
            </div>

            <div className="units-field">
              <label>Occupancy Rate (%)</label>
              <input
                type="number"
                value={data.rentRoll.occupancyRate}
                onChange={(e) =>
                  updateField("rentRoll", {
                    ...data.rentRoll,
                    occupancyRate: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="100"
                step="0.1"
                min="0"
                max="100"
              />
              <p className="units-field-hint">Current occupancy percentage</p>
            </div>
          </div>

          {data.rentRoll.totalMonthlyRent > 0 && (
            <div className="units-rentroll-summary">
              <div className="units-rentroll-summary-item">
                <span className="units-rentroll-summary-label">Annual Gross Rent:</span>
                <span className="units-rentroll-summary-value">
                  ${(data.rentRoll.totalMonthlyRent * 12).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              {totals.totalUnits > 0 && (
                <div className="units-rentroll-summary-item">
                  <span className="units-rentroll-summary-label">Avg Rent per Unit:</span>
                  <span className="units-rentroll-summary-value">
                    ${(data.rentRoll.totalMonthlyRent / totals.totalUnits).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                    /mo
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Documentation Section */}
        <section className="units-section">
          <h3>Documentation</h3>

          <div className="units-folder-card">
            <h4>📐 Unit Floor Plans</h4>
            <p>Floor plans and layouts for each unit type</p>
          </div>
        </section>
      </div>
    </div>
  );
}
