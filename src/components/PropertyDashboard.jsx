import React from 'react'
import { useTable } from '../context/TableProvider'
import { useScenario } from '../context/ScenarioRowProvider';

function PropertyDashboard({id}) {

    const {rows, setRows} = useTable();
    const {srows, setSrows, createScenario, setCreateScenario} = useScenario();

    function handleCreateScenario(value) {
        
        setCreateScenario(true);
        console.log(value);
        setRows(prevRows => prevRows.map(row =>
            row.id === id ?
            {
                ...row,
                ScenarioRows:[...row.ScenarioRows, Object.values(value)]
            }
            : row
              ))

       
    }


  return (
   <>
    <h1>Property Dashboard</h1>
    <div className='property-dashboard'>
        <div className='property-dashboard-row'>
        { Object.entries(rows[id]).map(([key, value]) => (
            key != 'ScenarioRows' ? <div className='property-cell'>
                <div>{key}</div>
                <div> {value || "N/A"}</div>
            </div> : <></>
        ))}
        </div>
    </div>
    <div>
          { createScenario &&
         <div className='property-dashboard'>
                {Object.entries(rows[id]).map(([key, value]) => (
                    key === 'ScenarioRows' ? 
                    <div>
                        {
                            
                        value.map((row, index) => 
                                    (
                                        <div className='property-cell-subrow'>
                                        {row.map((r,index) => (
                                            <div> 
                                            <div>{'Heading'}</div>
                                            <input className="cell"  value={r || ''} />
                                        </div>
                                        ))}
                                        </div>
                                    )
                                )
                         }
                    </div> : <></>
                ))}
                </div>}

         
    </div>
    <button onClick={() => handleCreateScenario(rows[id])} className='property-scenario-button'>+</button>
   </>
  )
}

export default PropertyDashboard