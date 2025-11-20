import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { useFinancing } from "@/hooks/useFinancing";
import {
  LOAN_TYPES,
  calculateMonthlyPayment,
  calculateLTV,
} from "@/utils/financing/financingDefaults";
import AccountingInput from "@/components/common/AccountingInput";
import AccountingNumber from "@/components/common/AccountingNumber";
import "@/styles/components/Financing/Financing.css";

/**
 * Financing Detail Panel
 */
export default function Financing({ propertyId }) {
  const { user } = useAuth();
  const { data, setData, loading, save } = useFinancing(user.uid, propertyId);

  // Calculate monthly payment
  const monthlyPayment = useMemo(() => {
    if (!data) return 0;
    return calculateMonthlyPayment(data.loanAmount, data.interestRate, data.amortizationYears);
  }, [data?.loanAmount, data?.interestRate, data?.amortizationYears]);

  // Calculate LTV (if we had purchase price)
  // For now, we'll just show the basic info

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
      toast.success("✅ Financing saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="financing-wrapper">
        <div className="financing-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="financing-wrapper">
      <div className="financing-panel">
        {/* Header */}
        <div className="fin-header">
          <h2>Financing</h2>
          <button className="fin-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Loan Details Section */}
        <section className="fin-section">
          <h3>Loan Details</h3>

          <div className="fin-fields-grid">
            <div className="fin-field fin-field-primary">
              <label>
                Loan Amount <span className="fin-primary-badge">Primary</span>
              </label>
              <AccountingInput
                value={data.loanAmount}
                onChange={(val) => updateField("loanAmount", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
              />
              <p className="fin-field-hint">Total loan amount</p>
            </div>

            <div className="fin-field">
              <label>Down Payment</label>
              <AccountingInput
                value={data.downPayment}
                onChange={(val) => updateField("downPayment", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
              />
              <p className="fin-field-hint">Initial down payment amount</p>
            </div>

            <div className="fin-field">
              <label>Loan Type</label>
              <select
                value={data.loanType}
                onChange={(e) => updateField("loanType", e.target.value)}
                className="fin-select"
              >
                <option value="">Select loan type...</option>
                {LOAN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="fin-field-hint">Type of financing</p>
            </div>
          </div>
        </section>

        {/* Terms Section */}
        <section className="fin-section">
          <h3>Loan Terms</h3>

          <div className="fin-fields-grid">
            <div className="fin-field">
              <label>Interest Rate</label>
              <AccountingInput
                value={data.interestRate}
                onChange={(val) => updateField("interestRate", val)}
                placeholder="0.00"
                decimals={2}
                symbolType="percent"
              />
              <p className="fin-field-hint">Annual interest rate percentage</p>
            </div>

            <div className="fin-field">
              <label>Term</label>
              <AccountingInput
                value={data.termYears}
                onChange={(val) => updateField("termYears", Math.round(val))}
                placeholder="0"
                decimals={0}
                symbolType="years"
              />
              <p className="fin-field-hint">Loan term length</p>
            </div>

            <div className="fin-field">
              <label>Amortization</label>
              <AccountingInput
                value={data.amortizationYears}
                onChange={(val) => updateField("amortizationYears", Math.round(val))}
                placeholder="0"
                decimals={0}
                symbolType="years"
              />
              <p className="fin-field-hint">Payment amortization period</p>
            </div>
          </div>
        </section>

        {/* Payment Summary Section */}
        {monthlyPayment > 0 && (
          <section className="fin-section fin-summary-section">
            <h3>Payment Summary</h3>

            <div className="fin-summary">
              <div className="fin-summary-grid">
                <div className="fin-summary-item">
                  <span className="fin-summary-label">Monthly Payment:</span>
                  <AccountingNumber value={monthlyPayment} showCurrency className="fin-summary-value" />
                </div>

                <div className="fin-summary-item">
                  <span className="fin-summary-label">Annual Debt Service:</span>
                  <AccountingNumber value={monthlyPayment * 12} showCurrency decimals={0} className="fin-summary-value" />
                </div>

                {data.termYears > 0 && (
                  <div className="fin-summary-item">
                    <span className="fin-summary-label">Total Payments over {data.termYears} years:</span>
                    <AccountingNumber value={monthlyPayment * 12 * data.termYears} showCurrency decimals={0} className="fin-summary-value" />
                  </div>
                )}
              </div>

              {data.termYears !== data.amortizationYears && data.termYears > 0 && (
                <div className="fin-summary-note">
                  <strong>Note:</strong> This loan has a balloon payment due at the end of year {data.termYears}. The
                  remaining balance will need to be refinanced or paid in full.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Documentation Section */}
        <section className="fin-section">
          <h3>Documentation</h3>

          <div className="fin-folder-card">
            <h4>📄 Loan Documents</h4>
            <p>Loan agreements, promissory notes, and financing documentation</p>
          </div>
        </section>
      </div>
    </div>
  );
}
