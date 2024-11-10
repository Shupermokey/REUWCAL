
function Cell({value}) {
  return (
    <div>
        {value ? value : '-'}
    </div>
  )
}

export default Cell