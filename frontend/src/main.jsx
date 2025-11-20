import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "@/styles/index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./config/queryClient";
import { initSentry } from "./config/sentry";
import { initAnalytics } from "./config/analytics";
import { initWebVitals } from "./utils/webVitals";
import ErrorBoundary from "./components/ErrorBoundary";

import { AppProvider } from "./app/providers/AppProvider.jsx";
import { TableProvider } from "./app/providers/TableProvider.jsx";
import { AuthProvider } from "./app/providers/AuthProvider.jsx";
import { UserSettingsProvider } from "./app/providers/UserSettingsProvider.jsx";
import SubscriptionProvider from "./app/providers/SubscriptionProvider.jsx";
import { DialogProvider } from "./app/providers/DialogProvider.jsx";
import { IncomeViewProvider } from "./app/providers/IncomeViewProvider.jsx";

// Initialize monitoring and analytics
initSentry();
initAnalytics();
initWebVitals();

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserSettingsProvider>
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
        </UserSettingsProvider>
      </AuthProvider>
      {/* React Query DevTools - only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </ErrorBoundary>
);
