import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePurchasePrice } from "@/hooks/usePurchasePrice";
import { calculateTotalAcquisitionCost } from "@/utils/purchasePrice/purchasePriceDefaults";
import AccountingInput from "@/components/common/AccountingInput";
import AccountingNumber from "@/components/common/AccountingNumber";
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
              <AccountingInput
                value={data.contractPrice}
                onChange={(val) => updateField("contractPrice", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
              />
              <p className="pp-field-hint">Agreed-upon purchase price</p>
            </div>

            <div className="pp-field">
              <label>Transaction Costs</label>
              <AccountingInput
                value={data.transactionCosts}
                onChange={(val) => updateField("transactionCosts", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
              />
              <p className="pp-field-hint">Closing costs, legal fees, title insurance</p>
            </div>

            <div className="pp-field">
              <label>Due Diligence</label>
              <AccountingInput
                value={data.dueDiligence}
                onChange={(val) => updateField("dueDiligence", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
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
              <AccountingInput
                value={data.capitalToStabilize}
                onChange={(val) => updateField("capitalToStabilize", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
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
              <AccountingInput
                value={data.capitalReserve}
                onChange={(val) => updateField("capitalReserve", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
              />
              <p className="pp-field-hint">Operating reserve for contingencies</p>
            </div>

            <div className="pp-field">
              <label>Other Expenses</label>
              <AccountingInput
                value={data.otherExpenses}
                onChange={(val) => updateField("otherExpenses", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
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
                  <AccountingNumber value={data.contractPrice} showCurrency className="pp-summary-value" />
                </div>
              )}
              {data.transactionCosts > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Transaction Costs:</span>
                  <AccountingNumber value={data.transactionCosts} showCurrency className="pp-summary-value" />
                </div>
              )}
              {data.dueDiligence > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Due Diligence:</span>
                  <AccountingNumber value={data.dueDiligence} showCurrency className="pp-summary-value" />
                </div>
              )}
              {data.capitalToStabilize > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">
                    Capital to Stabilize{data.capitalToStabilizeTimeframe && ` (${data.capitalToStabilizeTimeframe})`}:
                  </span>
                  <AccountingNumber value={data.capitalToStabilize} showCurrency className="pp-summary-value" />
                </div>
              )}
              {data.capitalReserve > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Capital Reserve:</span>
                  <AccountingNumber value={data.capitalReserve} showCurrency className="pp-summary-value" />
                </div>
              )}
              {data.otherExpenses > 0 && (
                <div className="pp-summary-item">
                  <span className="pp-summary-label">Other Expenses:</span>
                  <AccountingNumber value={data.otherExpenses} showCurrency className="pp-summary-value" />
                </div>
              )}
            </div>

            <div className="pp-summary-total">
              <span className="pp-summary-total-label">Total Acquisition Cost:</span>
              <AccountingNumber value={totalCost} showCurrency className="pp-summary-total-value" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
