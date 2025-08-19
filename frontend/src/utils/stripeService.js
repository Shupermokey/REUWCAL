import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

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
    const response = await fetch(
      "http://localhost:4000/api/subscription/create-checkout-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, tier }),
      }
    );

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


// src/utils/stripeService.js
const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g. "" or "/api"

export const PRICE_IDS = {
  Marketing: import.meta.env.VITE_STRIPE_PRICE_MARKETING,
  Developer: import.meta.env.VITE_STRIPE_PRICE_DEVELOPER,
  Syndicator: import.meta.env.VITE_STRIPE_PRICE_SYNDICATOR,
};

const must = (v, name) => {
  if (!v || String(v).trim() === "") throw new Error(`Missing ${name}. Check your .env`);
  return v;
};

const postJson = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
  }
  return res.json();
};

// /** Backwards-compatible name you already use */
// export async function handleCheckout(uid, priceId, opts = {}) {
//   must(uid, "uid");
//   must(priceId, "priceId");

//   const { url } = await postJson("/createCheckoutSession", {
//     uid,
//     priceId,
//     mode: "subscription",
//     success_url: opts.success_url || `${window.location.origin}/home`,
//     cancel_url: opts.cancel_url || window.location.href,
//   });
//   window.location.assign(url);
// }

/** Open Billing Portal (change plan/cancel/update card) */
export async function handleBillingPortal(uid, opts = {}) {
  must(uid, "uid");
  const { url } = await postJson("/createPortalLink", {
    uid,
    return_url: opts.return_url || window.location.href,
  });
  window.location.assign(url);
}

/** Optional aliases (newer names) */
export const startCheckout = handleCheckout;
export const openBillingPortal = handleBillingPortal;

/** Resume a pending checkout after login */
export async function resumeCheckoutIfPending(uid) {
  const plan = sessionStorage.getItem("pendingPlan");
  if (plan && PRICE_IDS[plan]) {
    sessionStorage.removeItem("pendingPlan");
    await handleCheckout(uid, PRICE_IDS[plan]);
    return true;
  }
  return false;
}
