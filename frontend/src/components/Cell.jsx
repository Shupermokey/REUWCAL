import { useEffect } from "react";

function Cell({rowId, field, value, handleCellChange}) {


  const handleChange = (e) => {
    console.log(e.target.value)
    handleCellChange(rowId, field, e.target.value);
  };

  return (
    <input className="cell" onChange={handleChange} value={value || ''} />
  )
}

export default Cell