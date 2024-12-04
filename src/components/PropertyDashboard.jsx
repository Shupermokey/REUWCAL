import React from 'react'
import { useTable } from '../context/TableProvider'
import { useScenario } from '../context/ScenarioRowProvider';

function PropertyDashboard({id}) {

    const {rows, setRows} = useTable([]);
    const {srows, setSrows, createScenario, setCreateScenario} = useScenario();

    const handleChange = (e) => {
        console.log(rows[id])
        console.log(e.target.value)
        e.target.value
      };

    function handleCreateScenario(value) {
        
        setCreateScenario(true);
        setSrows((prevSrows) => {
            const updatedSrows = { ...prevSrows };
            console.log("updatedSrows")
            console.log(updatedSrows)
            if (updatedSrows[rows[id]]) {
                updatedSrows[rows[id]] = [...updatedSrows[rows[id]], value];
              } else {
                updatedSrows[rows[id]] = [value];
              }
          
              return updatedSrows; // Update state with the new object
            });
       
        // newObj[rows[id]] = value;
        // setSrows(newObj)
        // //setSrows((prevValue) => [...prevValue, value])
        // console.log("Srow create " + newObj);
        // console.log(newObj);

    }


  return (
   <>
    <h1>Property Dashboard</h1>
    <div className='property-dashboard'>
        <div className='property-dashboard-row'>
        { Object.entries(rows[id]).map(([key, value]) => (
            <div className='property-cell'>
                <div>{key}</div>
                <div> {value || "N/A"}</div>
            </div>
        ))}
        </div>
    </div>
    <div>
        {/* { createScenario &&
         <div className='property-dashboard'>
            { Object.entries(srows).map(([key, value]) => (
            Object.entries(value).map(([key, value]) => (
                <div className='property-cell'>
                    <div>{key}</div>
                    <input className="cell"  value={value || ''} />

                </div>
            ))
        ))}
         </div>  
         } */}
          { createScenario &&
         <div className='property-dashboard'>
            { Object.entries(srows).map(([key, value]) => (
                Object.entries(value).map(([key, value]) => (
                    <div className='property-cell-subrow'>
                    {Object.entries(value).map(([key, value])=> (
                        <div>
                            <div>{key}</div>
                             <input className="cell"  value={value || ''} />
                        </div>

                    ))}
                    </div>
            ))
        ))}
         </div>  
         }
    </div>
    <button onClick={() => handleCreateScenario(rows[id])} className='property-scenario-button'>+</button>
   </>
  )
}

export default PropertyDashboard