import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePurchasePrice } from "@/hooks/usePurchasePrice";
import { calculateTotalAcquisitionCost } from "@/utils/purchasePrice/purchasePriceDefaults";
import "@/styles/components/PurchasePrice/PurchasePrice.css";

/**
 * PurchasePrice Detail Panel
 */
export default function PurchasePrice({ propertyId }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = usePurchasePrice(user.uid, propertyId);

  // Calculate total acquisition cost
  const totalCost = useMemo(() => {
    if (!data) return 0;
    return calculateTotalAcquisitionCost(data);
  }, [data]);

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
      toast.success("✅ Purchase Price saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="purchase-price-wrapper">
        <div className="purchase-price-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="purchase-price-wrapper">
      <div className="purchase-price-panel">
        {/* Header */}
        <div className="pp-header">
          <h2>Purchase Price & Acquisition Costs</h2>
          <button className="pp-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Purchase Price Section */}
        <section className="pp-section">
          <h3>Purchase Details</h3>

          <div className="pp-fields-grid">
            <div className="pp-field pp-field-primary">
              <label>
                Contract Price <span className="pp-required-badge">Primary</span>
              </label>
              <input
                type="number"
                value={data.contractPrice}
                onChange={(e) => updateField("contractPrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="pp-field-hint">Agreed-upon purchase price</p>
            </div>

            <div className="pp-field">
              <label>Transaction Costs</label>
              <input
                type="number"
                value={data.transactionCosts}
                onChange={(e) => updateField("transactionCosts", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="pp-field-hint">Closing costs, legal fees, title insurance</p>
            </div>

            <div className="pp-field">
              <label>Due Diligence</label>
              <input
                type="number"
                value={data.dueDiligence}
                onChange={(e) => updateField("dueDiligence", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="pp-field-hint">Inspection, appraisal, environmental reports</p>
            </div>
          </div>
        </section>

        {/* Capital Requirements Section */}
        <section className="pp-section">
          <h3>Capital Requirements</h3>

          <div className="pp-fields-grid">
            <div className="pp-field">
              <label>Capital to Stabilize</label>
              <input
                type="number"
                value={data.capitalToStabilize}
                onChange={(e) => updateField("capitalToStabilize", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="pp-field-hint">Renovation and improvement costs</p>
            </div>

            <div className="pp-field">
              <label>Stabilization Timeframe</label>
              <input
                type="text"
                value={data.capitalToStabilizeTimeframe}
                onChange={(e) => updateField("capitalToStabilizeTimeframe", e.target.value)}
                placeholder="e.g., 6 months, 1 year"
              />
              <p className="pp-field-hint">Expected time to complete stabilization</p>
            </div>

            <div className="pp-field">
              <label>Capital Reserve</label>
              <input
                type="number"
                value={data.capitalReserve}
                onChange={(e) => updateField("capitalReserve", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="pp-field-hint">Operating reserve for contingencies</p>
            </div>

            <div className="pp-field">
              <label>Other Expenses</label>
              <input
                type="number"
                value={data.otherExpenses}
                onChange={(e) => updateField("otherExpenses", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="pp-field-hint">Additional acquisition costs</p>
            </div>
          </div>
        </section>

        {/* Total Acquisition Cost Summary */}
        <section className="pp-section pp-summary-section">
          <h3>Total Acquisition Cost</h3>

          <div className="pp-summary">
            <div className="pp-summary-breakdown">
              {data.contractPrice > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Contract Price:</span>
                  <span className="pp-summary-value">${data.contractPrice.toLocaleString()}</span>
                </div>
              )}
              {data.transactionCosts > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Transaction Costs:</span>
                  <span className="pp-summary-value">${data.transactionCosts.toLocaleString()}</span>
                </div>
              )}
              {data.dueDiligence > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Due Diligence:</span>
                  <span className="pp-summary-value">${data.dueDiligence.toLocaleString()}</span>
                </div>
              )}
              {data.capitalToStabilize > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">
                    Capital to Stabilize{data.capitalToStabilizeTimeframe && ` (${data.capitalToStabilizeTimeframe})`}:
                  </span>
                  <span className="pp-summary-value">${data.capitalToStabilize.toLocaleString()}</span>
                </div>
              )}
              {data.capitalReserve > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Capital Reserve:</span>
                  <span className="pp-summary-value">${data.capitalReserve.toLocaleString()}</span>
                </div>
              )}
              {data.otherExpenses > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Other Expenses:</span>
                  <span className="pp-summary-value">${data.otherExpenses.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pp-summary-total">
              <span className="pp-summary-total-label">Total Acquisition Cost:</span>
              <span className="pp-summary-total-value">${totalCost.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
