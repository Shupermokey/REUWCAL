// CAPExSection.jsx
import React from 'react';

const CAPExSection = ({
  rows,
  baselineId,
  isPSF,
  isPercent,
  handleRowChange,
  handleDeleteRow,
}) => {
  const isTotal = (row) => row.name.toLowerCase().includes('total');

  return (
    <>
      <tr><td colSpan={4}><strong>Capital Expenditures (CapEx)</strong></td></tr>
      {rows.map((row) => {
        const isTotalRow = isTotal(row);
        return (
          <tr key={row.id} className={isTotalRow ? 'total-row' : ''}>
            <td>
              <input
                value={row.name}
                onChange={(e) => handleRowChange(baselineId, row.id, 'name', e.target.value)}
                disabled={isTotalRow}
              />
            </td>
            <td>
              <input
                type="number"
                value={isPSF ? row.percentBRI : row.$PSF}
                onChange={(e) => handleRowChange(
                  baselineId,
                  row.id,
                  isPSF ? 'percentBRI' : '$PSF',
                  parseFloat(e.target.value) || 0
                )}
                disabled={isTotalRow}
              />
              <span>{isPSF ? '%' : '$'}</span>
            </td>
            <td>
              <input
                type="number"
                value={row.growthRate}
                onChange={(e) => handleRowChange(
                  baselineId,
                  row.id,
                  'growthRate',
                  parseFloat(e.target.value) || 0
                )}
                disabled={isTotalRow}
              />
              <span>%</span>
            </td>
            <td>
              {!isTotalRow && (
                <button onClick={() => handleDeleteRow(row.id)}>🗑</button>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default CAPExSection;