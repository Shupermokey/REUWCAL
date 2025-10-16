import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "@/styles/index.css";

import { AppProvider } from "./app/providers/AppProvider.jsx";
import { TableProvider } from "./app/providers/TableProvider.jsx";
import { AuthProvider } from "./app/providers/AuthProvider.jsx";
import SubscriptionProvider from "./app/providers/SubscriptionProvider.jsx";
import { DialogProvider } from "./app/providers/DialogProvider.jsx";
import { IncomeViewProvider } from "./app/providers/IncomeViewProvider.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <AppProvider>
      <SubscriptionProvider>
        <TableProvider>
          <DialogProvider>
            <IncomeViewProvider>
              <App />
            </IncomeViewProvider>
          </DialogProvider>
        </TableProvider>
      </SubscriptionProvider>
    </AppProvider>
  </AuthProvider>
);
