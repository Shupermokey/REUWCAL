import "../Row.css"
import Cell from "./Cell"

function Row({id,propertyAddress, purchasePriceSF, purchasePrice, ACQCAPXSF, ACQCAPX, UnitCount, GrossBuildingArea, GrossSiteArea, REPropertyTax, MarketRate, ServiceStructure, PropertyClass, handleCellChange, isSelected, onSelect}) {
  return (
    <div className="row" onClick={onSelect} style={{backgroundColor: isSelected ? 'red' : "transparent", cursor: "pointer"}}>
        <div className="purchase-price-sf"><Cell rowId={id} field={'propertyAddress'} value={propertyAddress} handleCellChange={handleCellChange}/></div>
        <div className="purchase-price-sf"><Cell rowId={id} field={'purchasePriceSF'} value={purchasePriceSF} handleCellChange={handleCellChange}/></div>
        <div className="purchase-price"><Cell rowId={id} field={'purchasePrice'} value={purchasePrice} handleCellChange={handleCellChange}/></div>
        <div className="acq-capx-sf"><Cell rowId={id} field={'ACQCAPXSF'} value={ACQCAPXSF} handleCellChange={handleCellChange}/></div>
        <div className="acq-capx"><Cell rowId={id} field={'ACQCAPX'} value={ACQCAPX} handleCellChange={handleCellChange}/></div>
        <div className="unit-count"><Cell rowId={id} field={'UnitCount'} value={UnitCount} handleCellChange={handleCellChange}/></div>
        <div className="gross-building-area"><Cell rowId={id} field={'GrossBuildingArea'} value={GrossBuildingArea} handleCellChange={handleCellChange}/></div>
        <div className="gross-site-area"><Cell rowId={id} field={'GrossSiteArea'} value={GrossSiteArea} handleCellChange={handleCellChange}/></div>
        <div className="re-property-tax"><Cell rowId={id} field={'REPropertyTax'} value={REPropertyTax} handleCellChange={handleCellChange}/></div>
        <div className="market-rate"><Cell rowId={id} field={'MarketRate'} value={MarketRate} handleCellChange={handleCellChange}/></div>
        <div className="service-structure">
          <select name="base" id="Structure">
            <option value="base1">N/A</option>
            <option value="base1">Serv1</option>
            <option value="base2">Serv2</option>
            <option value="base3">Serv3</option>
            <option value="base4">Serv4</option>
          </select>
        </div>
        <div className="property-class"><Cell rowId={id} field={'PropertyClass'} value={PropertyClass} handleCellChange={handleCellChange}/></div>
        <div>
          <select name="base" id="">
            <option value="base1">Base1</option>
            <option value="base2">Base2</option>
            <option value="base3">Base3</option>
            <option value="base4">Base4</option>
          </select>
        </div>
    </div>
  )
}

export default Row