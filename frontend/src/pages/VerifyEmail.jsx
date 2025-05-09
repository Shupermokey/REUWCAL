import { useState } from "react";
import { useAuth } from "../app/AuthProvider";
import { getAuth, sendEmailVerification, signOut } from "firebase/auth";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const { user } = useAuth();
  const auth = getAuth();
  const [sending, setSending] = useState(false);

  const resendVerification = async () => {
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("✅ Verification email sent!");
    } catch (error) {
      console.error("❌ Error sending email:", error.message);
      toast.error("Failed to send verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-email-container">
      <h2>Verify Your Email</h2>
      <p>Check your email inbox to verify your account before logging in.</p>
      <button onClick={resendVerification} disabled={sending}>
        {sending ? "Sending..." : "Resend Email"}
      </button>
      <button onClick={() => signOut(auth)}>Logout</button>
    </div>
  );
};

export default VerifyEmail;
