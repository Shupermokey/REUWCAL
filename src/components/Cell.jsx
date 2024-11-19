
function Cell({rowId, field, value, handleCellChange}) {

  const handleChange = (e) => {
    handleCellChange(rowId, field, e.target.value);
  };

  return (
    <input className="cell" onChange={handleChange} value={value} />
  )
}

export default Cell