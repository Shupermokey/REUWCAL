// BaselineSection.jsx
import React from 'react';
import OPExSection from './OPExSection';
import CAPExSection from './CAPExSection';
import OtherSection from './OtherSection';

const BaselineSection = ({
  baseline,
  setBaseline,
  isPSF,
  isPercent,
  setIsPercent,
  setIsPSF,
  isAddingRow,
  setIsAddingRow,
  onSave,
  onDelete,
}) => {
  const handleRowChange = (baselineId, rowId, field, value) => {
    if (field === 'percentBRI') {
      if (value < 0) return;
      setBaseline((prev) => {
        const otherRowsTotal = prev.rows
          .filter(row => row.id !== 0 && row.id !== rowId)
          .reduce((acc, row) => acc + (row.percentBRI || 0), 0);
        const maxAllowed = 100 - otherRowsTotal;
        if (value > maxAllowed) value = maxAllowed;
        const updatedRows = prev.rows.map(row => {
          if (row.id === rowId) return { ...row, percentBRI: value };
          if (row.id === 0) return { ...row, percentBRI: +(100 - otherRowsTotal - value).toFixed(2) };
          return row;
        });
        return { ...prev, rows: updatedRows };
      });
      return;
    }
    setBaseline((prev) => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleDeleteRow = (rowId) => {
    setBaseline((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== rowId),
    }));
  };

  const opexRows = baseline.rows.filter(r => r.name?.toLowerCase().includes('expenses') || r.name?.includes('Subtotal OPEx'));
  const capexRows = baseline.rows.filter(r => r.name?.toLowerCase().includes('cap'));
  const otherRows = baseline.rows.filter(r => !opexRows.includes(r) && !capexRows.includes(r));

  return (
    <div className="baseline-table-container">
      <h2>Editing: {baseline.name}</h2>
      <h5>{isPSF ? "Editing BRI" : "Editing PSF"}</h5>
      <button onClick={() => {
        setIsPercent(!isPercent);
        setIsPSF(!isPSF);
      }}>
        Toggle Unit
      </button>

      <table>
        <thead>
          <tr>
            <th>Expense Type</th>
            <th>{isPSF ? '% BRI' : '$ PSF'}</th>
            <th>Growth Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <OPExSection
            rows={opexRows}
            baselineId={baseline.id}
            isPSF={isPSF}
            isPercent={isPercent}
            handleRowChange={handleRowChange}
            handleDeleteRow={handleDeleteRow}
          />
          <CAPExSection
            rows={capexRows}
            baselineId={baseline.id}
            isPSF={isPSF}
            isPercent={isPercent}
            handleRowChange={handleRowChange}
            handleDeleteRow={handleDeleteRow}
          />
          <OtherSection
            rows={otherRows}
            baselineId={baseline.id}
            isPSF={isPSF}
            isPercent={isPercent}
            handleRowChange={handleRowChange}
            handleDeleteRow={handleDeleteRow}
          />
        </tbody>
      </table>

      <div className="button-group">
        <button onClick={() => onSave(baseline)}>✓ Save</button>
        <button onClick={onDelete}>🗑 Delete</button>
        <button disabled={isAddingRow}>+ OPEx Add Row</button>
        <button disabled={isAddingRow}>+ CAPEx Add Row</button>
        <button onClick={() => { setBaseline(null); setIsAddingRow(false); }}>✖ Cancel</button>
      </div>
    </div>
  );
};

export default BaselineSection;
