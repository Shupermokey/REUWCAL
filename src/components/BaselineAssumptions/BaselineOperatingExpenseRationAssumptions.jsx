import React from 'react'

function BaselineOperatingExpenseRationAssumptions({isBase}) {
  return (
    <table className='acquisition-radio-assumptions-table'>
    <tr className='acquisition-radio-assumptions-row'>
      <th className='acquisition-radio-assumptions-cell'>Category</th>
      <th className='acquisition-radio-assumptions-cell'>% of PGI</th>
      <th className='acquisition-radio-assumptions-cell'>Growth Rate</th>
    </tr>

    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Base Rent (MR) Growth Rate</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
      <td className='acquisition-radio-assumptions-cell'>2.25%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Vacancy Rate</td>
      <td className='acquisition-radio-assumptions-cell'>5.00%</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Property Tax Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
      <td className='acquisition-radio-assumptions-cell'>6.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Property Insurance Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>5.00%</td>
      <td className='acquisition-radio-assumptions-cell'>7.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Property Utility Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>1.00%</td>
      <td className='acquisition-radio-assumptions-cell'>1.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Property CAM Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>2.00%</td>
      <td className='acquisition-radio-assumptions-cell'>2.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Property Repair Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>2.00%</td>
      <td className='acquisition-radio-assumptions-cell'>2.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Property Management Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>5.00%</td>
      <td className='acquisition-radio-assumptions-cell'>0.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Admin/Office Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Other+</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Subtotal</td>
      <td className='acquisition-radio-assumptions-cell'>20.00%</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Capital Expenses</td>
      <td className='acquisition-radio-assumptions-cell'>3.00%</td>
      <td className='acquisition-radio-assumptions-cell'>2.00%</td>
    </tr>
    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Total</td>
      <td className='acquisition-radio-assumptions-cell'>23.00%</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
    </tr>
    <button style={{backgroundColor:'red'}}>Adding row to Table Above</button>
</table>

  )
}

export default BaselineOperatingExpenseRationAssumptions