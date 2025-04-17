import React, { useEffect, useState } from "react";
import { loginUser } from "../../firebase/authService";
import { handleSignInWithEmailAndPassword, handleSignInWithGoogle } from "../../firebase/authService";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { getAuth, isSignInWithEmailLink, onAuthStateChanged, signInWithEmailAndPassword, signInWithEmailLink } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const {setToken } = useAuth();

  
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem("emailForSignIn");
      if (!storedEmail) {
        storedEmail = window.prompt("Please enter your email to confirm sign-in:");
      }

      if (storedEmail) {
        signInWithEmailLink(auth, storedEmail, window.location.href)
          .then((result) => {
            window.localStorage.removeItem("emailForSignIn");
            console.log("✅ Signed in successfully:", result.user);
            navigate("/home");
          })
          .catch((error) => {
            console.error("❌ Error signing in:", error);
          });
      }
    }
  }, [navigate]);

   const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    console.log("🔹 Login function triggered...");
   
    try {
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("✅ User Signed In:", user);

        // 🔹 Fetch latest user data from Firebase Auth
        await user.reload();
        console.log("✅ User Reloaded:", user);

        // ✅ Check if Email is Verified
        if (!user.emailVerified) {
            console.warn("❌ Email not verified. Redirecting user...");
            setError("You need to verify your email before logging in.");
            navigate("/verify-email");  // ✅ Redirect to verification page
            return;
        }

        // 🔹 Fetch Token
        const userToken = await user.getIdToken();
        if (!userToken) {
            throw new Error("⚠️ Failed to retrieve authentication token.");
        }
        
        console.log("✅ Retrieved Firebase Token:", userToken);
        setToken(userToken);

        console.log("🔹 Navigating to Home...");
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
        onChange={(e) => setEmail(e.target.value)}
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
    </form>
    </div>
  );
};

export default Login;
