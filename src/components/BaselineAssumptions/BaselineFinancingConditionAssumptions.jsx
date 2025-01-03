import React from 'react'

function BaselineFinancingConditionAssumptions({isBase}) {
  return (
    <table className='acquisition-radio-assumptions-table'>
        <th className='acquisition-radio-assumptions-row'>
            <td className='acquisition-radio-assumptions-cell'>LTV</td>
            <td className='acquisition-radio-assumptions-cell'>Amort. (YR)</td>
            <td className='acquisition-radio-assumptions-cell'>Period</td>
            <td className='acquisition-radio-assumptions-cell'>Interest Rate</td>
            <td className='acquisition-radio-assumptions-cell'>Discount Rate</td>
            <td className='acquisition-radio-assumptions-cell'>Date of Dis.R.</td>
        </th>
        <tr className='acquisition-radio-assumptions-row'>
            <td className='acquisition-radio-assumptions-cell'>Acq. Transaction Expenses Rate:</td>
            <td className='acquisition-radio-assumptions-cell'>60.00%</td>
            <td className='acquisition-radio-assumptions-cell'>25</td>
            <td className='acquisition-radio-assumptions-cell'>300</td>
            <td className='acquisition-radio-assumptions-cell'>6.25%</td>
            <td className='acquisition-radio-assumptions-cell'>5.00%</td>
            <td className='acquisition-radio-assumptions-cell'>10/19/24</td>
        </tr>
        <button style={{backgroundColor:'red'}}>Adding row to Table Above</button>
    </table>
  )
}

export default BaselineFinancingConditionAssumptions