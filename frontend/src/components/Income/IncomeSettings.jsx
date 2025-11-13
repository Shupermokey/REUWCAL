import React, { useState } from "react";
import { useIncomeView } from "@/app/providers/IncomeViewProvider";
import "@/styles/components/Income/IncomeSettings.css";

export default function IncomeSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { rateDecimalPlaces, setRateDecimalPlaces } = useIncomeView();

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      {/* Gear Icon Button */}
      <button
        className="income-settings-button"
        onClick={handleOpen}
        title="Income Statement Settings"
        type="button"
      >
        ⚙️
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="income-settings-backdrop" onClick={handleBackdropClick}>
          <div className="income-settings-modal">
            {/* Header */}
            <div className="income-settings-header">
              <h3>Income Statement Settings</h3>
              <button
                className="income-settings-close"
                onClick={handleClose}
                aria-label="Close settings"
              >
                ✖
              </button>
            </div>

            {/* Content */}
            <div className="income-settings-content">
              <div className="income-settings-section">
                <h4>Table Options</h4>

                <div className="income-settings-option">
                  <label htmlFor="rate-decimals">
                    Rate Decimal Places
                    <span className="income-settings-description">
                      Number of decimal places to display for rate percentages (0-4)
                    </span>
                  </label>
                  <select
                    id="rate-decimals"
                    value={rateDecimalPlaces}
                    onChange={(e) => setRateDecimalPlaces(parseInt(e.target.value, 10))}
                  >
                    <option value={0}>0 (e.g., 5%)</option>
                    <option value={1}>1 (e.g., 5.0%)</option>
                    <option value={2}>2 (e.g., 5.00%)</option>
                    <option value={3}>3 (e.g., 5.000%)</option>
                    <option value={4}>4 (e.g., 5.0000%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="income-settings-footer">
              <button className="income-settings-done" onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
