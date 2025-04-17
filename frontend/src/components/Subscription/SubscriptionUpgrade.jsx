// import { useState } from "react";
// import { useAuth } from "../../context/AuthProvider";
// import { db } from "../../firebase/firebaseConfig";
// import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

// const PRICE_NAMES = {
//   price_1Qsv7uEgiGJZMTseYDbIe3L5: 'free',
//   price_1Qsv8DEgiGJZMTseaDY7IXHY: 'marketing',
//   price_1Qsv8YEgiGJZMTsedR1y1jfF: 'developer',
//   price_1Qsv8pEgiGJZMTse04hQCTMM: 'syndicator',

// }

// const SubscriptionUpgrade = () => {
//     const { user, subscription, setSubscription, fetchSubscription } = useAuth();
//     const [loading, setLoading] = useState(false);

//     const handleUpgradeSubscription = async (newTier) => {
//         setLoading(true);

//         try {
//           const productsRef = collection(db, "products");
//           const productQuery = query(productsRef, where("name", "==", newTier));
//           const productSnap = await getDocs(productQuery);

//           if (productSnap.empty) {
//               throw new Error(`No product found for tier: ${newTier}`);
//           }

//           const productId = productSnap.docs[0].id;
//           console.log(`✅ Found Product ID: ${productId}`);

//           const pricesRef = collection(db, "products", productId, "prices");
//           const priceSnap = await getDocs(pricesRef);

//           if (priceSnap.empty) {
//               throw new Error(`No pricing data found for tier: ${newTier}`);
//           }

//           const priceId = priceSnap.docs[0].id;
//           console.log(`✅ Found Price ID: ${priceId}`);

//             console.log(`🔄 Attempting to upgrade subscription to: ${newTier}`);
//             // Check if user is on Free Plan
//             if (subscription === "free") {
//                 console.log("User is on Free Plan - Redirecting to Stripe Checkout...");

//                 const response = await fetch("http://localhost:4000/api/subscription/create-checkout-session", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ uid: user.uid, priceId  }),
//                 });

//                 const data = await response.json();

//                 if (data.checkoutUrl) {
//                     console.log("✅ Redirecting to Stripe Checkout:", data.checkoutUrl);
//                     window.location.href = data.checkoutUrl; // 🔹 Redirect user to checkout
//                 } else {
//                     throw new Error(data.error || "Failed to create checkout session.");
//                 }
//             } else {
//                 // User already has a paid plan → Upgrade via /update-subscription
//                 console.log("User has an active subscription - Updating via API...");

//                 const response = await fetch("http://localhost:4000/api/subscription/update-subscription", {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Bearer ${await user.getIdToken()}`, // 🔹 Secure with Firebase Token
//                     },
//                     body: JSON.stringify({ newPriceId: priceId }),
//                 });

//                 const data = await response.json();

//                 if (response.ok) {
//                   const userRef = doc(db, "users", user.uid);
//                   const userSnap = await getDoc(userRef);
//                   if (userSnap.exists()) {
//                       setSubscription(PRICE_NAMES[userSnap.data().subscriptionTier] || "free");
//                   }
//                 alert("Subscription updated successfully!");
//                 } else {
//                     throw new Error(data.error || "Failed to update subscription.");
//                 }
//             }
//         } catch (error) {
//             console.error("❌ Subscription upgrade failed:", error.message);
//             alert(`Error: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             <h2>Upgrade Subscription</h2>
//             <p>Current Subscription: <strong>{subscription}</strong></p>

//             <button onClick={() => handleUpgradeSubscription("marketing")} disabled={loading}>
//                 Upgrade to Marketing ($9.99/month)
//             </button>

//             <button onClick={() => handleUpgradeSubscription("developer")} disabled={loading}>
//                 Upgrade to Developer ($19.99/month)
//             </button>

//             <button onClick={() => handleUpgradeSubscription("syndicator")} disabled={loading}>
//                 Upgrade to Syndicator ($29.99/month)
//             </button>
//         </div>
//     );
// };

// export default SubscriptionUpgrade;

import { useState } from "react";
import { useAuth } from "../../context/AuthProvider";

const plans = {
  'price_1Qsv8DEgiGJZMTseaDY7IXHY': 'marketing',
}



const SubscriptionUpgrade = () => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async (chosenTier) => {
    setLoading(true);
    try {
      if (subscription === "free") {
        console.log(
          "🚀 User is on Free Tier - Redirecting to Stripe Checkout..."
        );

        // Free users need to start a subscription via checkout
        const response = await fetch(
          "http://localhost:4000/api/subscription/create-checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: user.uid, tier: chosenTier }), // Default to marketing tier
          }
        );

        const data = await response.json();

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error(data.error || "Failed to create checkout session.");
        }
      } else {
        console.log("🔄 Redirecting user to Stripe Customer Portal...");

        const response = await fetch(
          "http://localhost:4000/api/subscription/create-customer-portal-session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await user.getIdToken()}`, // 🔹 Secure with Firebase Token
            },
          }
        );

        const data = await response.json();

        if (data.portalUrl) {
          console.log("✅ Redirecting to Customer Portal:", data.portalUrl);
          window.location.href = data.portalUrl; // 🔹 Redirect user to Stripe
        } else {
          throw new Error(
            data.error || "Failed to create customer portal session."
          );
        }
      }
    } catch (error) {
      console.error("❌ Customer portal failed:", error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Manage Subscription</h2>
      <h3>{plans[subscription]}</h3>
       { subscription !== 'free' &&
      <button onClick={handleManageSubscription} disabled={loading}>
        {loading ? "Redirecting..." : "Manage Subscription in Stripe"}
      </button>
      
        }   

      { subscription === 'free' &&
              <>
              <button onClick={() => handleManageSubscription("marketing")} disabled={loading}>
    Upgrade to Marketing ($1.99/month)
</button>

<button onClick={() => handleManageSubscription("developer")} disabled={loading}>
    Upgrade to Developer ($5.99/month)
</button>

<button onClick={() => handleManageSubscription("syndicator")} disabled={loading}>
    Upgrade to Syndicator ($9.99/month)
</button>
</>
            }
    </div>
  );
};

export default SubscriptionUpgrade;
