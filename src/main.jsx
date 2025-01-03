import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppProvider.jsx'
import { TableProvider } from './context/TableProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      
      <AuthProvider>
      <AppProvider>
        <TableProvider>
          <App />
        </TableProvider>
      </AppProvider>
      </AuthProvider>
    
  </BrowserRouter>,
)
