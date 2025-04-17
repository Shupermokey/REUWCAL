import { useAuth } from "../context/AuthProvider";
import { getAuth, sendEmailVerification, signOut } from "firebase/auth";

const VerifyEmail = () => {
    const { user } = useAuth();
    const auth = getAuth();

    const resendVerification = async () => {
        try {
            await sendEmailVerification(auth.currentUser);
            alert("✅ Verification email sent! Check your inbox.");
        } catch (error) {
            console.error("❌ Error sending verification email:", error.message);
        }
    };

    return (
        <div>
            <h2>Verify Your Email</h2>
            <p>Check your email to verify your account before logging in.</p>
            <button onClick={resendVerification}>Resend Email</button>
            <button onClick={() => signOut(auth)}>Logout</button>
        </div>
    );
};

export default VerifyEmail;
