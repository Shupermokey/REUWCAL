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
    setBaseline(prev => {
      // Update the specific field
      let updatedRows = prev.rows.map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      );

      // Calculate subtotals and totals
      updatedRows = calculateTotals(updatedRows);

      return { ...prev, rows: updatedRows };
    });
  };

  // Calculate subtotals and totals automatically
  const calculateTotals = (rows) => {
    const isOpexRow = (row) => {
      const n = row.name.toLowerCase();
      return n.includes('expense') && !n.includes('subtotal') && !n.includes('total');
    };

    const isCapexRow = (row) => {
      const n = row.name.toLowerCase();
      return (n.includes('cap ex') || n.includes('capex') || n.includes('capital ex')) && !n.includes('total');
    };

    const isSubtotal = (row) => row.name.toLowerCase().includes('subtotal');
    const isTotal = (row) => row.name.toLowerCase().includes('total') && !row.name.toLowerCase().includes('subtotal');

    // Sum OpEx rows
    const opexSum = rows
      .filter(isOpexRow)
      .reduce((acc, row) => ({
        percentBRI: acc.percentBRI + (parseFloat(row.percentBRI) || 0),
        $PSF: acc.$PSF + (parseFloat(row.$PSF) || 0),
      }), { percentBRI: 0, $PSF: 0 });

    // Sum CapEx rows
    const capexSum = rows
      .filter(isCapexRow)
      .reduce((acc, row) => ({
        percentBRI: acc.percentBRI + (parseFloat(row.percentBRI) || 0),
        $PSF: acc.$PSF + (parseFloat(row.$PSF) || 0),
      }), { percentBRI: 0, $PSF: 0 });

    // Update rows with calculated values
    return rows.map(row => {
      if (isSubtotal(row)) {
        return {
          ...row,
          percentBRI: Math.min(opexSum.percentBRI, 100),
          $PSF: opexSum.$PSF,
          growthRate: 0, // Subtotals don't have growth rate
        };
      }
      if (isTotal(row)) {
        const totalPercentBRI = Math.min(opexSum.percentBRI + capexSum.percentBRI, 100);
        return {
          ...row,
          percentBRI: totalPercentBRI,
          $PSF: opexSum.$PSF + capexSum.$PSF,
          growthRate: 0, // Totals don't have growth rate
        };
      }
      return row;
    });
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

      <div className="baseline-content-wrapper">
        <div className="baseline-table-section">
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
        </div>

        <div className="baseline-controls-panel">
          <div className="controls-sticky">
            <h3>Controls</h3>
            <h5>Currently editing: {isPSF ? '% BRI' : '$ PSF'}</h5>

            <button
              className="toggle-unit-btn"
              onClick={() => {
                setIsPercent(!isPercent);
                setIsPSF(!isPSF);
              }}
            >
              Toggle Unit ({isPSF ? 'Switch to $ PSF' : 'Switch to % BRI'})
            </button>

            <div className="controls-divider"></div>

            <div className="button-group">
              <button onClick={() => onSave(baseline)}>✓ Save</button>
              <button onClick={onDelete}>🗑 Delete</button>

              {/* Add into correct section positions */}
              <button
                onClick={() => {
                  setIsAddingRow?.(true);
                  addRowBeforeMarker('Subtotal OPEx', 'opex');
                  setIsAddingRow?.(false);
                }}
              >
                + OPEx Add Row
              </button>

              <button
                onClick={() => {
                  setIsAddingRow?.(true);
                  addRowBeforeMarker('Total Ex', 'capex');
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
        </div>
      </div>
    </div>
  );
};

export default BaselineSection;
