import React from 'react'

function InvestmentGradeClassifications() {
  return (
    <table className='acquisition-radio-assumptions-table'>

    <tr className='acquisition-radio-assumptions-row'>
      <th className='acquisition-radio-assumptions-cell'>Investment-Grade Classifications</th>
      <th className='acquisition-radio-assumptions-cell'>Core</th>
      <th className='acquisition-radio-assumptions-cell'>Core-PLUS</th>
      <th className='acquisition-radio-assumptions-cell'>Growth</th>
      <th className='acquisition-radio-assumptions-cell'>Opportunistic</th>
      <th className='acquisition-radio-assumptions-cell'>Other+</th>
    </tr>

    <tr className='acquisition-radio-assumptions-row'>
      <td className='acquisition-radio-assumptions-cell'>Target IRR</td>
      <td className='acquisition-radio-assumptions-cell'>7%</td>
      <td className='acquisition-radio-assumptions-cell'>10%</td>
      <td className='acquisition-radio-assumptions-cell'>15%</td>
      <td className='acquisition-radio-assumptions-cell'>20%</td>
      <td className='acquisition-radio-assumptions-cell'>-</td>
    </tr>

</table>

  )
}

export default InvestmentGradeClassifications