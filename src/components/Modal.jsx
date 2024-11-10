import { useRow } from "../context/RowProvider";
import { useTable } from "../context/TableProvider";
import Row from "./Row";

function Modal(props) {

    const {rows, setRows, addingRow, setAddingRow} = useTable();

    
    const handleSubmit = (event) => {    
        const newRow = <Row
         propertyAddress={event.target[0].value}
         purchasePriceSF={event.target[1].value}
         purchasePrice={event.target[2].value}
         ACQCAPXSF={event.target[3].value}
         ACQCAPX={event.target[4].value}
         UnitCount={event.target[5].value}
         GrossBuildingArea={event.target[6].value}
         GrossSiteArea={event.target[7].value}
         REPropertyTax={event.target[8].value}
         MarketRate={event.target[9].value}
         ServiceStructure={event.target[10].value}
         PropertyClass={event.target[11].value} />
        setRows((prev) => [...prev, newRow])
        setAddingRow(false);
        }

  return (
    <form className="modal-popup" onSubmit={handleSubmit}>
        <input type="text" placeholder="Property Address"/>
        <input type="text" placeholder="Purchase Price ($/SF)"/>
        <input type="text" placeholder="Purchase Price"/>
        <input type="text" placeholder="ACQ CAPx ($/SF)"/>
        <input type="text" placeholder="ACQ CAPx ($)"/>
        <input type="text" placeholder="Unit Count"/>
        <input type="text" placeholder="Gross Building Area"/>
        <input type="text" placeholder="Gross Site Area"/>
        <input type="text" placeholder="RE Property Tax"/>
        <input type="text" placeholder="Market Rate"/>
        <input type="text" placeholder="Service Structure"/>  
        <input type="text" placeholder="Property Class"/>  
        <input type="submit" name="Submit" />
    </form>
  )
}

export default Modal