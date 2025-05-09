import React from "react";
import Login from "../features/auth/Auth/Login";
import Logo from "../features/auth/LoginPage/Logo";
import LoginFooter from "../features/auth/LoginPage/LoginFooter";
import Pricing from "../components/Pricing/Pricing";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-page-container">
      <div className="login-page-top">
        <Logo />
        <div>
          <Login />
          <button
            className="register-btn"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </div>

      <Pricing />
      <LoginFooter />
    </div>
  );
}

export default LoginPage;
