import React, { useEffect, useState } from "react";
import Login from "../components/Auth/Login";
import Logo from "../components/LoginPage/Logo";
import LoginFooter from "../components/LoginPage/LoginFooter";
import { auth, db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthProvider";
import Pricing from "../components/Pricing/Pricing";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const { user } = useAuth();

  return (
    <div className="login-page-container">
      <div className="login-page-top">
        <Logo />
        <div>
          <Login />
          <a className="register-btn" href="/register">
            Register
          </a>
        </div>
      </div>

      <Pricing />
      <LoginFooter />
    </div>
  );
}

export default LoginPage;
