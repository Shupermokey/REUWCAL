import React from "react";
import { useNavigate } from "react-router-dom";
import MagicLinkSender from "../features/auth/Auth/MagicLinkSender";
import Logo from "../features/auth/LoginPage/Logo";
import LoginFooter from "../features/auth/LoginPage/LoginFooter";

import "@/styles/components/LoginPage.css";

function MagicLinkPage() {
  const navigate = useNavigate();

  return (
    <div className="login-page-container">
      <div className="login-page-top">
        <Logo />
        <div>
          <MagicLinkSender />
          <button
            className="back-to-login-btn"
            onClick={() => navigate("/login")}
            style={{ marginTop: "20px", width: "100%" }}
          >
            ← Back to Login
          </button>
        </div>
      </div>

      <LoginFooter />
    </div>
  );
}

export default MagicLinkPage;
