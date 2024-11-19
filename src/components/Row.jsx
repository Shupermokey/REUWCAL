import "../Row.css"
import Cell from "./Cell"

function Row({propertyAddress, purchasePriceSF, purchasePrice, ACQCAPXSF, ACQCAPX, UnitCount, GrossBuildingArea, GrossSiteArea, REPropertyTax, MarketRate, ServiceStructure, PropertyClass, handleCellChange}) {
  return (
    <div className="row">
        <div className="purchase-price-sf"><Cell value={propertyAddress} handleCellChange={handleCellChange}/></div>
        <div className="purchase-price-sf"><Cell value={purchasePriceSF} handleCellChange={handleCellChange}/></div>
        <div className="purchase-price"><Cell value={purchasePrice} handleCellChange={handleCellChange}/></div>
        <div className="acq-capx-sf"><Cell value={ACQCAPXSF} handleCellChange={handleCellChange}/></div>
        <div className="acq-capx"><Cell value={ACQCAPX} handleCellChange={handleCellChange}/></div>
        <div className="unit-count"><Cell value={UnitCount} handleCellChange={handleCellChange}/></div>
        <div className="gross-building-area"><Cell value={GrossBuildingArea} handleCellChange={handleCellChange}/></div>
        <div className="gross-site-area"><Cell value={GrossSiteArea} handleCellChange={handleCellChange}/></div>
        <div className="re-property-tax"><Cell value={REPropertyTax} handleCellChange={handleCellChange}/></div>
        <div className="market-rate"><Cell value={MarketRate} handleCellChange={handleCellChange}/></div>
        <div className="service-structure"><Cell value={ServiceStructure} handleCellChange={handleCellChange}/></div>
        <div className="property-class"><Cell value={PropertyClass} handleCellChange={handleCellChange}/></div>
    </div>
  )
}

export default Row