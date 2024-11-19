import Row from "./components/Row"
import Table from "./components/Table"

import "./App.css"
import { TableProvider } from "./context/TableProvider"
import { RowProvider } from "./context/RowProvider"
import Sidebar from "./components/Sidebar"

function App() {


  return (
    <>
      <TableProvider>
        <RowProvider>
         <Sidebar pageWrapId={'page-wrap'} outerContainerId={'outer-container'} />
          <Table />
        </RowProvider>
      </TableProvider>
      
    </>
  )
}

export default App
