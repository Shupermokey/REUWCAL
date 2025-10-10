import React, { useEffect, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "../../../services/firebaseConfig";

const Login = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => window.localStorage.getItem("emailForSignIn") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

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
    </div>
  );
};

export default Login;
