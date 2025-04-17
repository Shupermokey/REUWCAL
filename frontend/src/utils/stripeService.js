import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const handleCheckout = async (uid, tier) => {
    try {
        console.log("🚀 Starting checkout for:", { uid, tier });

        // 🔹 Fetch User Firestore Data to Ensure Verification
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("❌ User not found in Firestore.");
            return;
        }

        

        // 🔹 Call Backend to Create Stripe Checkout Session
        const response = await fetch("http://localhost:4000/api/subscription/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, tier }),
        });

        if (!response.ok) {
            throw new Error("Stripe Checkout session failed.");
        }

        const { checkoutUrl } = await response.json();
        console.log(`✅ Redirecting to Stripe Checkout: ${checkoutUrl}`);

        window.location.href = checkoutUrl;
    } catch (error) {
        console.error("❌ Checkout failed:", error.message);
        alert("Error processing checkout. Try again.");
    }
};
