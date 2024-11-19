import { useEffect, useState } from "react"
import Row from "./Row"
import Modal from "./Modal";
import { useTable } from "../context/TableProvider";
import Levered from "./Levered";

function Table() {

  const {rows, setRows,
    leveredRow, setLeveredRow,
    unleveredRow, setUnleveredRow,
     addingRow, setAddingRow,
      selectedRow, setSelectedRow} = useTable();
  
  // useEffect(() => {
  //   setRows((prev) => [...prev])
  // }, [setSelectedRow])

  const handleAddEveredRows = () => {
    const newRowLevered = {
      id: leveredRow.length + 1,
      ENTCapRate: "",
      YieldOnCash: "",
      TenYearIRR: "",
      TenYearNPV: "",
      TenYearROI: "",
    };
    const newRowUnlevered = {
      id: unleveredRow.length + 1,
      ENTCapRate: "",
      YieldOnCash: "",
      TenYearIRR: "",
      TenYearNPV: "",
      TenYearROI: "",
    };

    setLeveredRow((prevRows) => [...prevRows, newRowLevered]);
    setUnleveredRow((prevRows) => [...prevRows, newRowUnlevered]);


  }

  const handleAddRow = () => {
    const newRow = {
      id: rows.length + 1,
      propertyAddress: "",
      purchasePriceSF: "",
      purchasePrice: "",
      ACQCAPXSF: "",
      ACQCAPX: "",
      UnitCount: "",
      GrossBuildingArea: "",
      GrossSiteArea: "",
      REPropertyTax: "",
      MarketRate: "",
      ServiceStructure: "",
      PropertyClass: "",
    };
    setRows((prevRows) => [...prevRows, newRow]);
    handleAddEveredRows();
  };

  const handleCellChange = (id, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };
 
  const handleRowSelect = (id) => {
    setSelectedRow(id);
  }
  
    return (
      <div class="table">
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


      { !addingRow && rows.map((row) =>  (
        <Row
        key={row.id}
        handleCellChange={handleCellChange}
        isSelected={row.id === selectedRow}
        onSelect={() => handleRowSelect(row.id)}
      />
      ))}


      {!addingRow ? <button onClick={() => handleAddRow()} className="add-row-btn">+</button> : <></>}

      <Levered name="Unlevered" />
      <Levered name="Levered" />
      </div>
  )
}

export default Table