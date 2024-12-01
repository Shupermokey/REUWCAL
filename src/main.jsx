import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppProvider.jsx'
import { TableProvider } from './context/TableProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AppProvider>
        <TableProvider>
          <App />
        </TableProvider>
      </AppProvider>
    
  </StrictMode>,
)
