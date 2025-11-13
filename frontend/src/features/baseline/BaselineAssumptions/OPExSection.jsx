// OPExSection.jsx
import React from 'react';

const OPExSection = ({
  rows,
  baselineId,
  isPSF,
  isPercent,
  handleRowChange,
  handleDeleteRow,
}) => {
  const isSubtotal = (row) => row.name.toLowerCase().includes('subtotal');

  return (
    <>
      <tr><td colSpan={4}><strong>Operating Expenses (OpEx)</strong></td></tr>
      {rows.map((row) => {
        const isSubtotalRow = isSubtotal(row);
        return (
          <tr key={row.id} className={isSubtotalRow ? 'total-row' : ''}>
            <td>
              <input
                value={row.name}
                onChange={(e) => handleRowChange(baselineId, row.id, 'name', e.target.value)}
                disabled={isSubtotalRow}
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
                disabled={isSubtotalRow}
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
                disabled={isSubtotalRow}
              />
              <span>%</span>
            </td>
            <td>
              {!isSubtotalRow && (
                <button onClick={() => handleDeleteRow(row.id)}>🗑</button>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default OPExSection;
