// App.jsx
import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoutes/ProtectedRoute";
import { routesConfig } from "@/routes/routesConfig.jsx";
import "@/styles/index.css"; // still fine here if preferred

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          {/* Map public routes */}
          {routesConfig
            .filter((r) => r.isPublic)
            .map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}

          {/* Map protected route groups */}
          {routesConfig
            .filter((r) => !r.isPublic && r.children)
            .map(({ element: minTier, children }) => (
              <Route
                key={minTier}
                element={<ProtectedRoute minTier={minTier} />}
              >
                {children.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>
            ))}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
