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
      setBaseline(prev => {
        const otherRowsTotal = prev.rows
          .filter(row => row.id !== 0 && row.id !== rowId)
          .reduce((acc, row) => acc + (row.percentBRI || 0), 0);

        let nextVal = value;
        const maxAllowed = 100 - otherRowsTotal;
        if (nextVal > maxAllowed) nextVal = maxAllowed;

        const updatedRows = prev.rows.map(row => {
          if (row.id === rowId) return { ...row, percentBRI: nextVal };
          if (row.id === 0)
            return { ...row, percentBRI: +(100 - otherRowsTotal - nextVal).toFixed(2) };
          return row;
        });
        return { ...prev, rows: updatedRows };
      });
      return;
    }

    setBaseline(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  /** Insert a new row BEFORE a marker row name (e.g., "Subtotal OPEx", "Total Ex") */
  const addRowBeforeMarker = (markerName, kind) => {
    setBaseline(prev => {
      const rows = [...prev.rows];
      const markerIndex = rows.findIndex(r => r.name === markerName);

      const newRow = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: kind === 'opex' ? 'Other Operating Expenses' : 'Capital Expenditure',
        percentBRI: 0,
        $PSF: 0,
        growthRate: 0,
    };

      if (markerIndex === -1) {
        rows.push(newRow);
      } else {
        rows.splice(markerIndex, 0, newRow); // insert BEFORE the marker
      }

      return { ...prev, rows };
    });
  };

  const handleDeleteRow = (rowId) => {
    setBaseline(prev => ({
      ...prev,
      rows: prev.rows.filter(row => row.id !== rowId),
    }));
  };

  // -------- Robust section grouping --------
  const isOpex = (name = '') => {
    const n = name.toLowerCase();
    return n.includes('expense') || name === 'Subtotal OPEx';
  };

  const isCapex = (name = '') => {
    const n = name.toLowerCase();
    return n.includes('cap ex') || n.includes('capex') || n.includes('capital ex') || name === 'Total Ex';
  };

  const opexRows = baseline.rows.filter(r => isOpex(r.name));
  const capexRows = baseline.rows.filter(r => isCapex(r.name));
  const otherRows = baseline.rows.filter(r => !isOpex(r.name) && !isCapex(r.name));

  return (
    <div className="baseline-table-container">
      <h2>Editing: {baseline.name}</h2>
      <h5>{isPSF ? 'Editing BRI' : 'Editing PSF'}</h5>

      <button
        onClick={() => {
          setIsPercent(!isPercent);
          setIsPSF(!isPSF);
        }}
      >
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

        {/* Add into correct section positions */}
        <button
          onClick={() => {
            setIsAddingRow?.(true);
            addRowBeforeMarker('Subtotal OPEx', 'opex');  // ← now definitely above Subtotal OPEx
            setIsAddingRow?.(false);
          }}
        >
          + OPEx Add Row
        </button>

        <button
          onClick={() => {
            setIsAddingRow?.(true);
            addRowBeforeMarker('Total Ex', 'capex');      // before Total Ex (CAPEx)
            setIsAddingRow?.(false);
          }}
        >
          + CAPEx Add Row
        </button>

        <button
          onClick={() => {
            setBaseline(null);
            setIsAddingRow?.(false);
          }}
        >
          ✖ Cancel
        </button>
      </div>
    </div>
  );
};

export default BaselineSection;
