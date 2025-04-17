import { useEffect, useState } from "react";
import { useRow } from "../context/RowProvider";
import { useTable } from "../context/TableProvider";
import Row from "./Row";

function Modal({ row, onSave }) {

    const {rows, setRows, addingRow, setAddingRow, setSelectedRow} = useTable();

  const [formData, setFormData] = useState({
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
  });

  // Initialize form data when the modal opens
  useEffect(() => {
    if (row) {
      setFormData({ ...row });
    }
  }, [row]);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };
    // Handle cancel button click
    const handleCancel = () => {
      onSave && onSave(null); // Optional chaining to avoid errors if onSave is undefined
    };
  

  return (
    <form className="modal-popup" onSubmit={handleSubmit}>
      <input type="text" name="propertyAddress" placeholder="Property Address" value={formData.propertyAddress} onChange={handleChange} />
      <input type="text" name="purchasePriceSF" placeholder="Purchase Price ($/SF)" value={formData.purchasePriceSF} onChange={handleChange} />
      <input type="text" name="purchasePrice" placeholder="Purchase Price" value={formData.purchasePrice} onChange={handleChange} />
      <input type="text" name="ACQCAPXSF" placeholder="ACQ CAPx ($/SF)" value={formData.ACQCAPXSF} onChange={handleChange} />
      <input type="text" name="ACQCAPX" placeholder="ACQ CAPx ($)" value={formData.ACQCAPX} onChange={handleChange} />
      <input type="text" name="UnitCount" placeholder="Unit Count" value={formData.UnitCount} onChange={handleChange} />
      <input type="text" name="GrossBuildingArea" placeholder="Gross Building Area" value={formData.GrossBuildingArea} onChange={handleChange} />
      <input type="text" name="GrossSiteArea" placeholder="Gross Site Area" value={formData.GrossSiteArea} onChange={handleChange} />
      <input type="text" name="REPropertyTax" placeholder="RE Property Tax" value={formData.REPropertyTax} onChange={handleChange} />
      <input type="text" name="MarketRate" placeholder="Market Rate" value={formData.MarketRate} onChange={handleChange} />
      <input type="text" name="ServiceStructure" placeholder="Service Structure" value={formData.ServiceStructure} onChange={handleChange} />
      <input type="text" name="PropertyClass" placeholder="Property Class" value={formData.PropertyClass} onChange={handleChange} />
      <button type="submit">Save</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </form>
  );
}

export default Modal