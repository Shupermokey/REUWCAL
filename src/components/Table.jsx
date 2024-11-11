import { useEffect, useState } from "react"
import Row from "./Row"
import Modal from "./Modal";
import { useTable } from "../context/TableProvider";

function Table() {

  const {rows, setRows, addingRow, setAddingRow, selectedRow, setSelectedRow} = useTable();
  
  useEffect(() => {
    setRows((prev) => [...prev])
  }, [setSelectedRow])

    function addRow() {
      setSelectedRow(null);
      setAddingRow(true);
  }

  function updateRow(row) {
    console.log(row)
    setAddingRow(true);
    setSelectedRow(row);
  }

  
  // Function to handle save/update from modal
  function handleSave(updatedData) {
    if (!updatedData) {
      // Cancel action, just close the modal
      setAddingRow(false);
      setSelectedRow(null);
      return;
    }
  
    if (selectedRow) {
      // Update existing row
      const updatedRows = rows.map((r) => (r.id === updatedData.id ? updatedData : r));
      setRows(updatedRows);
    } else {
      // Add new row
      const newRow = { id: Date.now(), ...updatedData };
      setRows((prev) => [...prev, newRow]);
    }
  
    setAddingRow(false);
    setSelectedRow(null);
  }
  
    return (
      <>
      {!addingRow ? <Row
      propertyAddress={'Property Address'}
      purchasePriceSF={'Purchase Price ($/SF)'}
      purchasePrice={'Purchase Price'}
      ACQCAPXSF={'ACQ CAPx ($/SF)'}
      ACQCAPX={'ACQ CAPx ($)'}
      UnitCount={'Unit Count'}
      GrossBuildingArea={'Gross Building Area'}
      GrossSiteArea={'Gross Site Area (Acres)'}
      REPropertyTax={'RE Property Tax'}
      MarketRate={'Market Rate'}
      ServiceStructure={'Service Structure'}
      PropertyClass={'Property Class'}
          /> : null}

      {addingRow && <Modal row={selectedRow} onSave={handleSave} />}
      { !addingRow && rows.map((row, index) =>  (
        <Row
        key={index}
        propertyAddress={row.propertyAddress}
        purchasePriceSF={row.purchasePriceSF}
        purchasePrice={row.purchasePrice}
        ACQCAPXSF={row.ACQCAPXSF}
        ACQCAPX={row.ACQCAPX}
        UnitCount={row.UnitCount}
        GrossBuildingArea={row.GrossBuildingArea}
        GrossSiteArea={row.GrossSiteArea}
        REPropertyTax={row.REPropertyTax}
        MarketRate={row.MarketRate}
        ServiceStructure={row.ServiceStructure}
        PropertyClass={row.PropertyClass}
        onClick={() => updateRow(row)}
      />
      ))}


      {!addingRow ? <button onClick={() => addRow()} className="add-row-btn">+</button> : <></>}
      </>
  )
}

export default Table