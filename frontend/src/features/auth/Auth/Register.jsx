import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../../../services/firebaseConfig";           // modular SDK
import { createUserProfile } from "../../../services/firestoreService";
import { handleCheckout } from "../../../utils/stripeService";     // keeps your existing API
import { handleSignInWithGoogle } from "../../../services/authService";
import { useAuth } from "../../../app/providers/AuthProvider";

const Register = () => {
  const { setSubscription } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState("free"); // 'free' | 'marketing' | 'developer' | 'syndicator'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password || !tier) {
        throw new Error("Please fill in all required fields.");
      }

      // 1) Create the auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const uid = user.uid;

      // 2) Send verification email (optional to gate features by verification later)
      await sendEmailVerification(user);
      alert("📧 Verification email sent! Please check your inbox.");

      // 3) Create user profile doc (store Free as current tier; keep intendedTier for reference)
      await createUserProfile(uid, {
        email,
        subscriptionTier: "free",   // actual access is derived from Stripe subs
        intendedTier: tier,         // what they chose at signup
        createdVia: "email_password",
      });

      // 4) If they selected a paid plan, start Checkout.
      //    Your handleCheckout(uid, tier) is preserved (expects the tier string).
      if (tier !== "free") {
        await handleCheckout(uid, tier);
        // ^ will redirect to Stripe; no further code runs in this tab after navigation
        return;
      }

      // 5) Free plan → go to login (or home), your choice:
      navigate("/", { replace: true }); // back to login page
      // navigate("/home", { replace: true }); // or take them into the app

    } catch (err) {
      console.error("❌ Registration failed:", err);
      setError(err?.message || "Registration failed. Please try again.");

      // Cleanup auth user if we created one but something else failed
      const current = auth.currentUser;
      if (current) {
        try { await deleteUser(current); } catch (e) {
          console.warn("⚠️ Failed to delete user after error:", e?.message || e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Join Our Exclusive Real Estate Network</h2>

      <form onSubmit={handleRegister} className="register-form">
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="tier">Select Your Membership Plan:</label>
        <select
          id="tier"
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setSubscription?.(e.target.value); // keep your local context behavior
          }}
        >
          <option value="free">Free</option>
          <option value="marketing">Marketing ($10/mo)</option>
          <option value="developer">Developer ($20/mo)</option>
          <option value="syndicator">Syndicator ($50/mo)</option>
        </select>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <button onClick={handleSignInWithGoogle}>Sign In With Google</button>
    </div>
  );
};

export default Register;
