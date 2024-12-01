import Row from "./components/Row"
import Table from "./components/Table"

import "./App.css"
import { TableProvider, useTable } from "./context/TableProvider"
import { RowProvider } from "./context/RowProvider"
import Sidebar from "./components/Sidebar"
import { AppProvider, useApp } from "./context/AppProvider"
import BaselineTable from "./components/BaselineTable"
import PropertyDashboard from "./components/PropertyDashboard"
import { ScenarioProvider } from "./context/ScenarioRowProvider"

function App() {

  const {base} = useApp();
  const {selectedRow} = useTable();

  return (
    <>
    
        <ScenarioProvider>
        <RowProvider>
          <Sidebar />
          {base === false && <Table />}
          {base !== false && <BaselineTable/>}
        </RowProvider>
        </ScenarioProvider>

      
    </>
  )
}

export default App
