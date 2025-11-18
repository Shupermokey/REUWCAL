import React from 'react';
import '@/styles/components/Income/UnitModals.css';

/**
 * Modal to confirm creating a unit in the Units table
 */
export default function CreateUnitModal({
  unitName,
  unitType,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="unit-modal-overlay" onClick={onCancel}>
      <div className="unit-modal-content" onClick={e => e.stopPropagation()}>
        <h3>Create Unit in Units Table?</h3>

        <p>
          You created <strong>"{unitName}"</strong> under <strong>"{unitType}"</strong>
          {' '}in Income Statement.
        </p>

        <p>Would you like to:</p>
        <ul>
          <li>Create this unit in the Units table</li>
          <li>Add tenant info, lease dates, etc.</li>
          <li>Link it to this Income Statement row</li>
        </ul>

        <p className="modal-note">
          You can still add it later from the Units section if you choose "Skip".
        </p>

        <div className="unit-modal-actions">
          <button className="unit-btn-secondary" onClick={onCancel}>
            Skip
          </button>
          <button className="unit-btn-primary" onClick={onConfirm}>
            Create & Link Unit
          </button>
        </div>
      </div>
    </div>
  );
}
