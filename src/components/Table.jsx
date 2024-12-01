import { useEffect, useState } from "react"
import Row from "./Row"
import Modal from "./Modal";
import { useTable } from "../context/TableProvider";
import Levered from "./Levered";
import PropertyDashboard from "./PropertyDashboard";

function Table() {

  const {rows, setRows,
    leveredRow, setLeveredRow,
    unleveredRow, setUnleveredRow,
     addingRow, setAddingRow,
      selectedRow, setSelectedRow} = useTable();
  

  const updateEveredRows = () => {
    const newRowLevered = {
      id: 0,
      ENTCapRate: "",
      YieldOnCash: "",
      TenYearIRR: "",
      TenYearNPV: "",
      TenYearROI: "",
    };
    const newRowUnlevered = {
      id: 0,
      ENTCapRate: "",
      YieldOnCash: "",
      TenYearIRR: "",
      TenYearNPV: "",
      TenYearROI: "",
    };

    setLeveredRow([newRowLevered]);
    setUnleveredRow([newRowUnlevered]);


  }

  const handleAddRow = () => {
    const newRow = {
      id: rows.length,
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
    setSelectedRow(newRow.id)
    updateEveredRows();
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
        id={row.id}
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
        handleCellChange={handleCellChange}
        isSelected={row.id === selectedRow}
        onSelect={() => handleRowSelect(row.id)}
      />
      ))}


      {!addingRow ? <button onClick={() => handleAddRow()} className="add-row-btn">+</button> : <></>}

      <Levered name="Unlevered" />
      <Levered name="Levered" />
      {selectedRow > -1 && <PropertyDashboard id={selectedRow}/>}
      </div>
  )
}

export default Table