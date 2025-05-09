import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
} from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../services/firebaseConfig";
import { handleCheckout } from "../../../utils/stripeService";
import { handleSignInWithGoogle } from "../../../services/authService";
import { useAuth } from "../../../app/AuthProvider";
import { createUserProfile } from "../../../services/firestoreService"; 

const Register = () => {
  const { setSubscription } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState("free");
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

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      await sendEmailVerification(user);
      alert("📧 Verification email sent! Please check your inbox.");

      // Wait for Stripe Extension to attach stripeCustomerId
      let stripeCustomerId = null;
      const customerRef = doc(auth.firestore || auth._delegate.firestore, "customers", uid); // fallback fix

      for (let attempts = 0; attempts < 5; attempts++) {
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists() && customerSnap.data().stripeId) {
          stripeCustomerId = customerSnap.data().stripeId;
          break;
        }
        await new Promise((res) => setTimeout(res, 3000));
      }

      if (!stripeCustomerId) {
        throw new Error("Stripe integration failed. Please try again.");
      }

      await createUserProfile(uid, {
        email,
        subscriptionTier: tier,
        stripeCustomerId,
      });

      if (tier !== "free") {
        await handleCheckout(uid, tier);
      }

      navigate("/");
    } catch (err) {
      console.error("❌ Registration failed:", err.message);
      setError(err.message);

      // Cleanup user if registration fails
      const current = auth.currentUser;
      if (current) {
        await deleteUser(current).catch((error) =>
          console.warn("⚠️ Failed to delete user:", error.message)
        );
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
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
            setSubscription(e.target.value);
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
