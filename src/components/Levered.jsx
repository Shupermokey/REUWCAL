import React from 'react'
import { useTable } from '../context/TableProvider';

function Levered({name}) {

    const {rows, leveredRow, setLeveredRow, selectedRow} = useTable();


    function calculatingTableRow(){
        if(rows[selectedRow]!==undefined &&
            rows[selectedRow]['purchasePriceSF']!=='' &&
            rows[selectedRow]['purchasePrice']!=='' &&
            rows[selectedRow]['ACQCAPXSF']!=='' &&
            rows[selectedRow]['ACQCAPX']!=='' &&
            rows[selectedRow]['UnitCount']!=='' &&
            rows[selectedRow]['GrossBuildingArea']!=='' &&
            rows[selectedRow]['GrossSiteArea']!=='' &&
            rows[selectedRow]['REPropertyTax']!=='' &&
            rows[selectedRow]['MarketRate']!=='' &&
            //rows[selectedRow]['ServiceStructure']!=='' &&  //This I need to check if it's needed for the (un)levered calculations. If not, just check if it's present and apply that value to the rest of the row
            rows[selectedRow]['PropertyClass']!=='' 
         ){
            //console.log(rows[selectedRow]['ServiceStructure'])
            return "Good"
        }
        else {
            // console.log(rows[selectedRow]['ServiceStructure'])
            return "Bad"
        }
    }

  return (
    <div className='evered-box-container'>
        <div className='evered-box-header'>{name} - Return Metrics</div>
        <div className='evered-box'>
            <div>ENT CAP Rate</div>
            <div>Yield-on-Cash</div>
            <div>10-Year IRR</div>
            <div>10-Year NPV</div>
            <div>10-Yr ROI</div>
        </div>
        {
            name==='Levered' && leveredRow.map(()=> (
                <div className='everedMetrics'>
                    <div>{rows[selectedRow]!==undefined ? calculatingTableRow() : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['purchasePriceSF'] : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['purchasePrice'] : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['ACQCAPXSF'] : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['ACQCAPX'] : "-"}</div>

                </div>
            ))
            
        }
        {
            name==='Unlevered' && leveredRow.map(()=> (
                <div className='everedMetrics'>
                    <div className='everedMetrics'>
                    <div>{rows[selectedRow]!==undefined ? calculatingTableRow() : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['purchasePriceSF'] : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['purchasePrice'] : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['ACQCAPXSF'] : "-"}</div>
                    <div>{rows[selectedRow]!==undefined ? rows[selectedRow]['ACQCAPX'] : "-"}</div>

                </div>
                </div>
            ))
        }

    </div>
  )
}

export default Levered