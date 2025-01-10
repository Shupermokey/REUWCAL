import "./App.css";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import PricingPage from "./pages/PricingPage";
import BaselineTablePage from "./pages/BaselineTablePage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/home" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
        <Route path="/pricing" element={<ProtectedRoute><PricingPage/></ProtectedRoute>}/>
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
        <Route path="/baseline" element={<ProtectedRoute><BaselineTablePage/></ProtectedRoute>}/>
        <Route path="*" element={<Navigate to="/" />} /> {/* Fallback route */}
      </Routes>
    </Router>
  );
}

export default App;
