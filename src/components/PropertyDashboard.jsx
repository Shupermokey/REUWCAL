import React from 'react'
import { useTable } from '../context/TableProvider'
import { useScenario } from '../context/ScenarioRowProvider';

function PropertyDashboard({id}) {

    const {rows, setRows} = useTable([]);
    const {srows, setSrows, createScenario, setCreateScenario} = useScenario();


    function handleCreateScenario(value) {
       // console.log(scenarioCreated)
        setCreateScenario(true);
        setSrows((prevValue) => [...prevValue, value])

    }


  return (
   <>
    <h1>Property Dashboard</h1>
    <div className='property-dashboard'>
        { Object.entries(rows[id]).map(([key, value]) => (
            <div className='property-cell'>
                <div>{key}</div>
                <div> {value || "N/A"}</div>
            </div>
        ))}
    </div>
    <div>
        { createScenario &&
         <div >
            {
                srows.map(
                    (item) => (
                        <div className='property-dashboard'>
                            { Object.entries(item).map(([key, value]) => (
                            <div className='property-cell'>
                                <div>{key}</div>
                                <div> {value || "N/A"}</div>
                            </div>
                        ))}
                        </div>
                ))
            }
         </div>  
         }
    </div>
    <button onClick={() => handleCreateScenario(rows[id])} className='property-scenario-button'>+</button>
   </>
  )
}

export default PropertyDashboard