import React, { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendEmailVerification,
} from "firebase/auth";

import { handleCheckout } from "../../utils/stripeService";
import { useAuth } from "../../context/AuthProvider";
import { auth, db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { handleSignInWithGoogle } from "../../firebase/authService";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState("free");
  const { subscription, setSubscription } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password || !tier) {
        throw new Error("Please fill in all required fields.");
    }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;
      const user = userCredential.user;

      console.log("User registered:", userCredential.user);


      await sendEmailVerification(user);
      console.log("📧 Verification email sent");
      alert("📧 Verification email sent! Please check your inbox.");
      
      // 🔹 Step 3: Wait for Stripe Firebase Extension to Create `stripeCustomerId`
      let attempts = 0;
      let stripeCustomerId = null;
      const customerRef = doc(db, "customers", uid);

      while (attempts < 5) {
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists() && customerSnap.data().stripeId) {
              stripeCustomerId = customerSnap.data().stripeId;
              break;
          }
          console.log("⌛ Waiting for Stripe Customer ID...");
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
          attempts++;
      }

      if (!stripeCustomerId) {
          console.warn("❌ Stripe Customer ID not found after retries.");
          setError("Stripe integration failed. Try again.");
          setLoading(false);
          return;
      }

      console.log(`✅ Stripe Customer ID retrieved: ${stripeCustomerId}`);


      await setDoc(doc(db, "users", uid), {
        email,
        subscriptionTier: tier,
        stripeCustomerId,
        createdAt: new Date().toISOString(),
      });

      console.log("User data saved in Firestore:", {
        email,
        subscriptionTier: tier,
      });
     

     
      if (tier !== "free") {
        
        await handleCheckout(uid, tier);

      } else {
        console.log("✅ Registration successful, no checkout required.");
      }
    } catch (err) {
      console.error("❌ Registration failed:", err.message);
      setError(err.message);

      // 🔥 Step 6: Rollback (Delete Firebase Auth User if created)
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user).catch((error) =>
          console.warn("⚠️ Failed to delete user:", error.message)
        );
      }
    } finally {
      setLoading(false);
      navigate("/")
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
            console.log("Tier selected:", e.target.value);
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
