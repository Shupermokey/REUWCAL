import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppProvider.jsx'
import { TableProvider } from './context/TableProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { SubscriptionProvider } from './context/SubscriptionProvider.jsx'

createRoot(document.getElementById('root')).render(
  // <BrowserRouter>
      
      <AuthProvider>
      <AppProvider>
      <SubscriptionProvider>
        <TableProvider>
          <App />
        </TableProvider>
        </SubscriptionProvider>
      </AppProvider>
      </AuthProvider>
    
  // </BrowserRouter>,
)
