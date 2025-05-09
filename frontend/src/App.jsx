import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmail from "./pages/VerifyEmail";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import PricingPage from "./pages/PricingPage";
import ProfilePage from "./pages/ProfilePage";
import BaselinePage from "./pages/BaselinePage";
import Unauthorized from "./pages/Unauthorized";
import DeveloperTools from "./pages/DeveloperTools";
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes (No Tier Restriction for Now) */}
        <Route
          path="/verify-email"
          element={
            <ProtectedRoute>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baseline"
          element={
            <ProtectedRoute>
              <BaselinePage />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/developer-tools"
          element={
            <ProtectedRoute allowedTiers={["developer", "price_1Qsv8pEgiGJZMTse04hQCTMM"]}>
              <DeveloperTools />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
