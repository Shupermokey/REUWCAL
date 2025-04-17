import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import PricingPage from "./pages/PricingPage";
import BaselineTablePage from "./pages/BaselineTablePage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoute";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import VerifyEmail from "./pages/VerifyEmail";
import { auth } from "./firebase/firebaseConfig";
import { useEffect, useState } from "react";
import BaselinePage from "./pages/BaselinePage";
import { Toaster } from "react-hot-toast";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);
  return (
    <>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          <Route path="/" element={user ? <Home /> : <LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                {" "}
                <Home />{" "}
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
          {/* <Route path="*" element={<Navigate to="/" />} /> Fallback route */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
