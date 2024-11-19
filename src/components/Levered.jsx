import React from 'react'
import { useTable } from '../context/TableProvider';

function Levered({name}) {

    const {leveredRow, setLeveredRow,} = useTable();


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
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                </div>
            ))
            
        }
        {
            name==='Unlevered' && leveredRow.map(()=> (
                <div className='everedMetrics'>
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                </div>
            ))
        }

    </div>
  )
}

export default Levered