import React, { useState } from 'react'
import AcquisitionRatioAssumptions from './BaselineAssumptions/AcquisitionRatioAssumptions'
import BaselineFinancingConditionAssumptions from './BaselineAssumptions/BaselineFinancingConditionAssumptions'
import BaselineOperatingExpenseRationAssumptions from './BaselineAssumptions/BaselineOperatingExpenseRationAssumptions'
import OperatingExpenseVLookupTable from './BaselineAssumptions/OperatingExpenseVLookupTable'
import InvestmentGradeClassifications from './BaselineAssumptions/InvestmentGradeClassifications'

function BaselineTable() {

  const [isBase, setIsBase] = useState(true);

  function handleCreateBase() {
      setIsBase(!isBase);
  }

  return (
    <div>

        {isBase && <>
        <AcquisitionRatioAssumptions isBase={ isBase }/>
        <br/>
        <BaselineFinancingConditionAssumptions isBase={ isBase }/>
        <br/> 
        <BaselineOperatingExpenseRationAssumptions isBase={ isBase }/> 
        <br/> 
        <OperatingExpenseVLookupTable isBase={ isBase }/> 
        <br/> 
        <InvestmentGradeClassifications isBase={ isBase }/> 
        <br/>
        </>}

        {!isBase && <>
        <AcquisitionRatioAssumptions isBase={ isBase }/>
        <br/>
        <BaselineFinancingConditionAssumptions isBase={ isBase }/>
        <br/> 
        <BaselineOperatingExpenseRationAssumptions isBase={ isBase }/> 
        <br/> 
        <OperatingExpenseVLookupTable isBase={ isBase }/> 
        <br/> 
        <InvestmentGradeClassifications isBase={ isBase }/> 
        <br/>
        </>}

        <button onClick={() => handleCreateBase()}>+++</button>
    </div>
  )
}

export default BaselineTable