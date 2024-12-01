import React from 'react'

function AcquisitionRatioAssumptions() {
  return (
    <table className='acquisition-radio-assumptions-table'>
        <th className='acquisition-radio-assumptions-row'>
            <td className='acquisition-radio-assumptions-cell'></td>
            <td className='acquisition-radio-assumptions-cell'>% of $</td>
            <td className='acquisition-radio-assumptions-cell'>Growth Rate</td>
        </th>
        <tr className='acquisition-radio-assumptions-row'>
            <td className='acquisition-radio-assumptions-cell'>Acq. Transaction Expenses Rate:</td>
            <td className='acquisition-radio-assumptions-cell'>5.50%</td>
            <td className='acquisition-radio-assumptions-cell'>-</td>
        </tr>
        <tr className='acquisition-radio-assumptions-row'>
            <td className='acquisition-radio-assumptions-cell'>Appreciation Rate:</td>
            <td className='acquisition-radio-assumptions-cell'>-</td>
            <td className='acquisition-radio-assumptions-cell'>1.00%</td>
        </tr>
        <tr className='acquisition-radio-assumptions-row'>
            <td className='acquisition-radio-assumptions-cell'>Rev. Transaction Expenses Rate:</td>
            <td className='acquisition-radio-assumptions-cell'>10.00%</td>
            <td className='acquisition-radio-assumptions-cell'>-</td>
        </tr>
    </table>
  )
}

export default AcquisitionRatioAssumptions