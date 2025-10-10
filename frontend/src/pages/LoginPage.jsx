// src/pages/LoginPage.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import Login from "../features/auth/Auth/Login";
import Logo from "../features/auth/LoginPage/Logo";
import LoginFooter from "../features/auth/LoginPage/LoginFooter";
import Pricing from "../components/Pricing/Pricing";
import { resumeCheckoutIfPending } from "../utils/stripeService"; 

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Prevent running the resume logic more than once per mount
  const handledRef = useRef(false);

  useEffect(() => {
    if (!user || handledRef.current) return;
    handledRef.current = true;

    (async () => {
      // If the user clicked "Subscribe" before logging in, resume Stripe checkout
      const redirected = await resumeCheckoutIfPending(user.uid);
      if (redirected) return; // we're navigating away to Stripe

      // Otherwise, send them where they were headed, or to /home
      const to = location.state?.from?.pathname || "/home";
      navigate(to, { replace: true }); // remove this line if your <Login> already navigates
    })();
  }, [user, navigate, location.state]);

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
