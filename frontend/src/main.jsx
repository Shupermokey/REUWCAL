import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppProvider } from "./app/AppProvider.jsx";
import { TableProvider } from "./app/TableProvider.jsx";
import { AuthProvider } from "./app/AuthProvider.jsx";
import SubscriptionProvider from "./app/SubscriptionProvider.jsx";
import { DialogProvider } from "./app/DialogProvider.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <AppProvider>
      <SubscriptionProvider>
        <TableProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </TableProvider>
      </SubscriptionProvider>
    </AppProvider>
  </AuthProvider>
);
