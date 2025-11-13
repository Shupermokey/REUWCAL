import React, { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "../../../services/firebaseConfig";

const MagicLinkSender = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const actionCodeSettings = {
        // URL you want to redirect back to after email link click
        url: window.location.origin + "/login", // or /finishSignIn
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Save email to localStorage so we can confirm sign-in
      window.localStorage.setItem("emailForSignIn", email);

      setSent(true);
      console.log("✅ Magic link sent to:", email);
    } catch (error) {
      console.error("❌ Error sending magic link:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="magic-link-success">
        <h3>✉️ Check your email!</h3>
        <p>
          We sent a magic link to <strong>{email}</strong>
        </p>
        <p className="muted">Click the link in your email to sign in.</p>
      </div>
    );
  }

  return (
    <div className="magic-link-form">
      <h3>Sign in with Magic Link</h3>
      <p className="muted">We'll email you a link to sign in without a password.</p>

      <form onSubmit={handleSendMagicLink}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default MagicLinkSender;
