import "../Row.css"
import Cell from "./Cell"

function Row({propertyAddress, purchasePriceSF, purchasePrice, ACQCAPXSF, ACQCAPX, UnitCount, GrossBuildingArea, GrossSiteArea, REPropertyTax, MarketRate, ServiceStructure, PropertyClass, onClick}) {
  return (
    <div className="row" onClick={onClick}>
        <div className="purchase-price-sf"><Cell value={propertyAddress}/></div>
        <div className="purchase-price-sf"><Cell value={purchasePriceSF}/></div>
        <div className="purchase-price"><Cell value={purchasePrice}/></div>
        <div className="acq-capx-sf"><Cell value={ACQCAPXSF}/></div>
        <div className="acq-capx"><Cell value={ACQCAPX}/></div>
        <div className="unit-count"><Cell value={UnitCount}/></div>
        <div className="gross-building-area"><Cell value={GrossBuildingArea}/></div>
        <div className="gross-site-area"><Cell value={GrossSiteArea}/></div>
        <div className="re-property-tax"><Cell value={REPropertyTax}/></div>
        <div className="market-rate"><Cell value={MarketRate}/></div>
        <div className="service-structure"><Cell value={ServiceStructure}/></div>
        <div className="property-class"><Cell value={PropertyClass}/></div>
        <div className="edit-row"><button>Edit</button></div> 
        <div className="delete-row"><button>Delete</button></div>
    </div>
  )
}

export default Row