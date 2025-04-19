// OtherSection.jsx
import React from 'react';

const OtherSection = ({
  rows,
  baselineId,
  isPSF,
  isPercent,
  handleRowChange,
  handleDeleteRow,
}) => {
  return (
    <>
      <tr><td colSpan={4}><strong>Other</strong></td></tr>
      {rows.map((row) => (
        <tr key={row.id}>
          <td>
            <input
              value={row.name}
              onChange={(e) => handleRowChange(baselineId, row.id, 'name', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              value={isPSF ? row.percentBRI : row.$PSF}
              onChange={(e) => handleRowChange(
                baselineId,
                row.id,
                isPSF ? 'percentBRI' : 'PSF',
                parseFloat(e.target.value) || 0
              )}
            />{' '}
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
            />{' '}
            <span>{isPSF ? '%' : '$'}</span>
          </td>
          <td>
            <button onClick={() => handleDeleteRow(row.id)}>🗑</button>
          </td>
        </tr>
      ))}
    </>
  );
};

export default OtherSection;
