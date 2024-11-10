import { useState } from "react"
import Row from "./Row"
import Modal from "./Modal";
import { useTable } from "../context/TableProvider";

function Table() {

  const {rows, setRows, addingRow, setAddingRow} = useTable();


    function addRow() {
      setAddingRow(true);
  }

    return (
      <>
      <Row
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
          />
      {addingRow ? <Modal  /> : <></>}
      {rows.map((row, index) =>  (
        <div key={index}>{row}</div>
      ))}


      {!addingRow ? <button onClick={() => addRow()} className="add-row-btn">+</button> : <></>}
      </>
  )
}

export default Table