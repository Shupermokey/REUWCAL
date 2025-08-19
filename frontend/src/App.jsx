// App.jsx
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import ProfilePage from './pages/ProfilePage';
import BaselinePage from './pages/BaselinePage';
import Unauthorized from './pages/Unauthorized';
import DeveloperTools from './pages/DeveloperTools';

import ProtectedRoute from './components/ProtectedRoutes/ProtectedRoute';
import { TIERS } from './constants/tiers'; // ⬅️ new

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} /> {/* alias, matches ProtectedRoute default */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} /> {/* keep PUBLIC to avoid redirect loops */}

        {/* Auth-required (no special tier) */}
        <Route element={<ProtectedRoute minTier={TIERS.Free} />}>
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/baseline" element={<BaselinePage />} />
        </Route>

        {/* Higher-tier routes */}
        <Route element={<ProtectedRoute minTier={TIERS.Developer} />}>
          <Route path="/developer-tools" element={<DeveloperTools />} />
        </Route>

        {/* Optional static page */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
