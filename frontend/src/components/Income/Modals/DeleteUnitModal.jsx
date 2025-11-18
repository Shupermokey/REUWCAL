import React, { useState } from 'react';
import '@/styles/components/Income/UnitModals.css';

/**
 * Modal to choose how to delete a linked unit
 */
export default function DeleteUnitModal({
  unitName,
  onConfirm,
  onCancel,
}) {
  const [deleteOption, setDeleteOption] = useState('unlink');

  return (
    <div className="unit-modal-overlay" onClick={onCancel}>
      <div className="unit-modal-content" onClick={e => e.stopPropagation()}>
        <h3>Delete Linked Unit?</h3>

        <p>
          <strong>"{unitName}"</strong> is linked to the Units table.
          {' '}What would you like to do?
        </p>

        <div className="delete-options">
          <label className="delete-option">
            <input
              type="radio"
              name="deleteOption"
              value="unlink"
              checked={deleteOption === 'unlink'}
              onChange={() => setDeleteOption('unlink')}
            />
            <div>
              <strong>Unlink only</strong>
              <p>Keep unit in Units table, remove link</p>
              <p className="recommended">(Recommended - preserves tenant data)</p>
            </div>
          </label>

          <label className="delete-option">
            <input
              type="radio"
              name="deleteOption"
              value="delete"
              checked={deleteOption === 'delete'}
              onChange={() => setDeleteOption('delete')}
            />
            <div>
              <strong>Delete from both</strong>
              <p>Remove from Income Statement AND Units table permanently</p>
            </div>
          </label>
        </div>

        <div className="unit-modal-actions">
          <button className="unit-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="unit-btn-danger"
            onClick={() => onConfirm(deleteOption)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
