import Row from "./components/Row"
import Table from "./components/Table"

import "./App.css"
import { TableProvider } from "./context/TableProvider"
import { RowProvider } from "./context/RowProvider"

function App() {


  return (
    <>
      <TableProvider>
        <RowProvider>
          <Table />
        </RowProvider>
      </TableProvider>
      
    </>
  )
}

export default App
