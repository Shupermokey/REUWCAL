import React, { useEffect, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "../../../services/firebaseConfig";
import { handleSignInWithGoogle } from "../../../services/authService";

const Login = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => window.localStorage.getItem("emailForSignIn") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showMagicLink, setShowMagicLink] = useState(false);

  // ✅ Magic Link Sign-in
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem("emailForSignIn");
            console.log("✅ Signed in via email link:", result.user);
            navigate("/home");
          })
          .catch((error) => {
            console.error("❌ Error signing in:", error.message);
            setError("Email link sign-in failed.");
          });
      }
    }
  }, [email, navigate]);

  // 🔐 Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await user.reload();

      if (!user.emailVerified) {
        console.warn("❌ Email not verified.");
        setError("You need to verify your email before logging in.");
        navigate("/verify-email");
        return;
      }

      const userToken = await user.getIdToken();
      if (!userToken) throw new Error("Failed to retrieve authentication token.");
      setToken(userToken);
      console.log("✅ Logged in and token saved.");
      navigate("/home");
    } catch (error) {
      console.error("❌ Login Failed:", error.message);
      setError(error.message);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await handleSignInWithGoogle();
      console.log("✅ Signed in with Google");
      navigate("/home");
    } catch (error) {
      console.error("❌ Google Sign-In Failed:", error.message);
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          className="email-login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            window.localStorage.setItem("emailForSignIn", e.target.value);
          }}
          required
        />
        <input
          className="pass-login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="login-btn" type="submit">Login</button>
        {error && <p className="login-error">{error}</p>}
      </form>

      <div className="divider">OR</div>

      <button className="google-login-btn" onClick={handleGoogleSignIn}>
        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        Sign in with Google
      </button>

      <div className="login-footer">
        <button
          className="link-btn"
          onClick={() => navigate("/magic-link")}
        >
          Or sign in with a magic link (no password)
        </button>
      </div>
    </div>
  );
};

export default Login;
