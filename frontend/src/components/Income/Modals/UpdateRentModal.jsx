import React from 'react';
import '@/styles/components/Income/UnitModals.css';

/**
 * Modal to choose how to update rent for a linked unit
 */
export default function UpdateRentModal({
  unitName,
  oldRent,
  newRent,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="unit-modal-overlay" onClick={onCancel}>
      <div className="unit-modal-content" onClick={e => e.stopPropagation()}>
        <h3>Update Linked Unit Rent?</h3>

        <p>
          <strong>"{unitName}"</strong> is linked to the Units table.
        </p>

        <div className="rent-change-display">
          <div className="rent-old">
            <span className="rent-label">Current:</span>
            <span className="rent-value">${oldRent.toLocaleString()}/mo</span>
          </div>
          <div className="rent-arrow">→</div>
          <div className="rent-new">
            <span className="rent-label">New:</span>
            <span className="rent-value">${newRent.toLocaleString()}/mo</span>
          </div>
        </div>

        <p className="modal-question">Update rent in Units table too?</p>

        <div className="unit-modal-actions">
          <button className="unit-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="unit-btn-tertiary"
            onClick={() => onConfirm('income-only')}
          >
            Income Statement Only
          </button>
          <button
            className="unit-btn-primary"
            onClick={() => onConfirm('both')}
          >
            Update Both
          </button>
        </div>
      </div>
    </div>
  );
}
