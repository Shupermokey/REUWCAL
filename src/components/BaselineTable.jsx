import React from 'react'
import AcquisitionRatioAssumptions from './BaselineAssumptions/AcquisitionRatioAssumptions'
import BaselineFinancingConditionAssumptions from './BaselineAssumptions/BaselineFinancingConditionAssumptions'
import BaselineOperatingExpenseRationAssumptions from './BaselineAssumptions/BaselineOperatingExpenseRationAssumptions'
import OperatingExpenseVLookupTable from './BaselineAssumptions/OperatingExpenseVLookupTable'
import InvestmentGradeClassifications from './BaselineAssumptions/InvestmentGradeClassifications'

function BaselineTable() {
  return (
    <div>
        <AcquisitionRatioAssumptions/>
        <br/>
        <BaselineFinancingConditionAssumptions/>
        <br/>
        <BaselineOperatingExpenseRationAssumptions/>
        <br/>
        <OperatingExpenseVLookupTable/>
        <br/>
        <InvestmentGradeClassifications/>
    </div>
  )
}

export default BaselineTable