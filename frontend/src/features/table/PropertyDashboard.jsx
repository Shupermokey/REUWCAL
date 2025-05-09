import React from "react";
import { useTable } from "../../app/TableProvider";
import { useScenario } from "../../app/ScenarioRowProvider";

function PropertyDashboard({ id }) {
    const { rows, setRows } = useTable();
    const { srows, setSrows, createScenario, setCreateScenario } = useScenario();
  
    // ✅ Find the correct row by ID instead of using index
    const selectedRow = rows.find(row => row.id === id);
    
    if (!selectedRow) {
      return <h1>Property Dashboard - No row selected</h1>;
    }
  
    function handleCreateScenario(value) {
      setCreateScenario(true);
      console.log(value);
  
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === id
            ? {
                ...row,
                ScenarioRows: [...row.ScenarioRows, Object.values(value)],
              }
            : row
        )
      );
    }
  
    return (
      <>
        <h1>Property Dashboard</h1>
        <div className="property-dashboard">
          <div className="property-dashboard-row">
            {Object.entries(selectedRow).map(([key, value]) =>
              key !== "ScenarioRows" ? (
                <div key={key} className="property-cell">
                  <div>{key}</div>
                  <div>{value || "N/A"}</div>
                </div>
              ) : null
            )}
          </div>
        </div>
  
        <div>
          {createScenario && (
            <div className="property-dashboard">
              {selectedRow.ScenarioRows.map((scenarioRow, index) => (
                <div key={index} className="property-cell-subrow">
                  {scenarioRow.map((r, subIndex) => (
                    <div key={subIndex}>
                      <div>{"Heading"}</div>
                      <input className="cell" value={r || ""} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
  
        <button
          onClick={() => handleCreateScenario(selectedRow)}
          className="property-scenario-button"
        >
          +
        </button>
      </>
    );
  }
  
  export default PropertyDashboard;
  
