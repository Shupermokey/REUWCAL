import express from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";
import admin from "firebase-admin";
import { db } from "../firebase/adminConfig.js";
import { stripe, updateSubscription, cancelSubscription, updatePaymentMethod } from "../services/stripeService.js";

const router = express.Router();


/**
 * ================================
 * 🚀 Subscription API Routes
 * ================================
 * 
 * ✅ Base Route: /api/subscription
 * 
 * 📌 GET  /fetch                   → Fetch the user's current subscription tier
 * 📌 GET  /details                 → Fetch full subscription details from Stripe
 * 📌 GET  /invoices                → Retrieve user's billing history (invoices)
 * 📌 GET  /upcoming-invoice        → Preview next invoice before upgrading/downgrading
 * 
 * 📌 POST /create-checkout-session → Create a checkout Stripe session
 * 📌 POST /update-subscription     → Upgrade or downgrade a subscription
 * 📌 POST /cancel                  → Cancel subscription (immediate or end of cycle)
 * 📌 POST /resume                  → Resume a canceled subscription before cycle ends
 * 📌 POST /reactivate              → Reactivate after full cancellation (new subscription)
 * 📌 POST /update-payment-method   → Update user's default payment method in Stripe
 * 📌 POST /refund                  → Process a refund for the user's last payment
 * 📌 POST /change-billing-date     → Change the next billing cycle date
 * 
 * 🛠 Requires:
 * - Firebase Authentication (verifyFirebaseToken middleware)
 * - Firebase Admin SDK for Firestore
 * - Stripe for subscription & payment handling
 */

const PRICE_NAMES = {
    price_1Qsv7uEgiGJZMTseYDbIe3L5: 'free',
    price_1Qsv8DEgiGJZMTseaDY7IXHY: 'marketing',
    price_1Qsv8YEgiGJZMTsedR1y1jfF: 'developer',
    price_1Qsv8pEgiGJZMTse04hQCTMM: 'syndicator',
  
  }


  router.post("/create-customer-portal-session", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;

        // ✅ Fetch Stripe Customer ID from Firestore
        const userRef = db.collection("users").doc(uid);
        console.log(userRef);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const stripeCustomerId = userSnap.data().stripeCustomerId;
        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe customer ID not found" });
        }

        // ✅ Create a Stripe Customer Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: "http://localhost:5173/home", // Redirect after managing subscription
        });

        console.log(`✅ Customer Portal Session Created: ${session.url}`);

        res.json({ portalUrl: session.url });
    } catch (error) {
        console.error("❌ Error creating customer portal session:", error.message);
        res.status(500).json({ error: error.message });
    }
});



/**
 * ✅ Create a Stripe Checkout Session
 */
router.post("/create-checkout-session", async (req, res) => {
    try {
        const { uid, tier } = req.body;

        if (!uid || !tier) {
            return res.status(400).json({ error: "User ID and tier are required" });
        }

        // 🔹 Fetch the user from Firestore
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe customer ID not found" });
        }

        // 🔹 Fetch product based on `tier`
        const productsRef = db.collection("products");
        const productQuery = await productsRef.where("name", "==", tier).get();

        if (productQuery.empty) {
            return res.status(404).json({ error: `No product found for tier: ${tier}` });
        }

        const productId = productQuery.docs[0].id;
        console.log(`✅ Found Product ID: ${productId}`);

        // 🔹 Fetch price ID from the `prices` subcollection
        const pricesSnap = await db.collection("products").doc(productId).collection("prices").get();

        if (pricesSnap.empty) {
            return res.status(404).json({ error: `No pricing data found for tier: ${tier}` });
        }

        const priceId = pricesSnap.docs[0].id;
        console.log(`✅ Found Price ID: ${priceId}`);
        await userRef.update({subscriptionTier: tier})
        // 🔹 Create a Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:5173/cancel",
        });

        console.log(`✅ Stripe Checkout Session Created: ${session.url}`);

        res.json({ checkoutUrl: session.url });

    } catch (error) {
        console.error("❌ Stripe Checkout Session Creation Failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});


/**
 * ✅ Fetch User Subscription
 * This route fetches the active subscription of a logged-in user.
 */
router.get("/fetch", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;

        console.log(`🔹 Fetching subscription for UID: ${uid}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        return res.json({ subscriptionTier: userData.subscriptionTier });

    } catch (error) {
        console.error("❌ Error fetching subscription:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * ✅ Upgrade or Downgrade Subscription
 * Allows users to change their subscription plan.
 */
router.post("/update-subscription", verifyFirebaseToken, async (req, res) => {
try {
    const { uid } = req.user;
    const { newPriceId } = req.body;

    if (!newPriceId) {
        return res.status(400).json({ error: "Missing required parameters." });
    }

    console.log(`🔹 Updating subscription for UID: ${uid} → New Price ID: ${newPriceId}`);

    // ✅ Fetch User Document
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found in Firestore." });
    }

    const userData = userSnap.data();
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
        return res.status(400).json({ error: "Stripe Customer ID missing." });
    }

    // ✅ Fetch Active Subscription from Firestore
    const subscriptionsRef = db.collection("customers").doc(uid).collection("subscriptions");
    const activeSubscriptionsSnap = await subscriptionsRef.where("status", "==", "active").get();

    if (activeSubscriptionsSnap.empty) {
        return res.status(404).json({ error: "No active subscription found." });
    }

    const subscriptionId = activeSubscriptionsSnap.docs[0].id;
    console.log(`✅ Found Active Subscription ID: ${subscriptionId}`);

     // ✅ Get Subscription Item ID (`si_xxx`) from Firestore
     const subscriptionItems = activeSubscriptionsSnap.docs[0].data().items;
     if (!subscriptionItems || subscriptionItems.length === 0) {
         return res.status(404).json({ error: "No subscription item found." });
     }
     const subscriptionItemId = subscriptionItems[0].id;
     console.log(`✅ Found Subscription Item ID: ${subscriptionItemId}`);


     // ✅ Update Subscription Item in Stripe
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscriptionItemId, // ✅ Correct subscription item ID
                price: newPriceId,      // ✅ New price ID
            }],
        });

    // ✅ Update Subscription Tier in Firestore
    await userRef.update({ subscriptionTier: PRICE_NAMES[newPriceId] });

    res.json({ message: "Subscription updated successfully!", updatedSubscription });

} catch (error) {
    console.error("❌ Subscription update failed:", error.message);
    res.status(500).json({ error: error.message });
}
});

/**
 * ✅ Cancel Subscription
 * Allows users to cancel their subscription either immediately or at the end of the billing period.
 */
router.post("/cancel", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { immediate } = req.body; // `immediate: true` cancels immediately

        console.log(`🔹 Cancelling subscription for UID: ${uid} → Immediate: ${immediate}`);

        // ✅ Fetch Active Subscription from Firestore
        const subscriptionsRef = collection(db, "customers", uid, "subscriptions");
        const activeSubscriptionsQuery = query(subscriptionsRef, where("status", "==", "active"));
        const activeSubscriptionsSnap = await getDocs(activeSubscriptionsQuery);

        if (activeSubscriptionsSnap.empty) {
            return res.status(404).json({ error: "No active subscription found." });
        }

        const subscriptionId = activeSubscriptionsSnap.docs[0].id;
        console.log(`✅ Found Active Subscription ID: ${subscriptionId}`);

        // ✅ Cancel Subscription in Stripe
        const canceledSubscription = await cancelSubscription(subscriptionId, immediate);

        // ✅ Update Firestore to reflect cancellation
        await updateDoc(doc(db, "users", uid), { subscriptionTier: "free" });

        res.json({ message: `Subscription ${immediate ? "canceled immediately" : "scheduled for cancellation"}.`, canceledSubscription });

    } catch (error) {
        console.error("❌ Subscription cancellation failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * ✅ Update Payment Method
 * Allows users to update their default payment method.
 */
router.post("/update-payment-method", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { paymentMethodId } = req.body;

        if (!paymentMethodId) {
            return res.status(400).json({ error: "Missing payment method ID." });
        }

        console.log(`🔹 Updating payment method for UID: ${uid} → Payment Method: ${paymentMethodId}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe Customer ID missing." });
        }

        // ✅ Update Payment Method in Stripe
        const updatedCustomer = await updatePaymentMethod(stripeCustomerId, paymentMethodId);

        res.json({ message: "Payment method updated successfully!", updatedCustomer });

    } catch (error) {
        console.error("❌ Payment method update failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * ✅ Get Full Subscription Details from Stripe
 * Fetches the user's active subscription details (plan, status, renewal date, etc.)
 */
router.get("/details", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;

        console.log(`🔹 Fetching Stripe subscription details for UID: ${uid}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe Customer ID missing." });
        }

        // ✅ Fetch Active Subscription from Firestore
        const subscriptionsRef = collection(db, "customers", uid, "subscriptions");
        const activeSubscriptionsQuery = query(subscriptionsRef, where("status", "==", "active"));
        const activeSubscriptionsSnap = await getDocs(activeSubscriptionsQuery);

        if (activeSubscriptionsSnap.empty) {
            return res.status(404).json({ error: "No active subscription found." });
        }

        const subscriptionId = activeSubscriptionsSnap.docs[0].id;

        // ✅ Fetch Subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        res.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            items: subscription.items.data.map(item => ({
                priceId: item.price.id,
                productId: item.price.product,
            })),
        });

    } catch (error) {
        console.error("❌ Error fetching subscription details:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * ✅ Resume a Canceled Subscription
 * Removes the cancel_at_period_end flag if the user wants to resume their subscription.
 */
router.post("/resume", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;

        console.log(`🔹 Resuming subscription for UID: ${uid}`);

        // ✅ Fetch Active Subscription
        const subscriptionsRef = collection(db, "customers", uid, "subscriptions");
        const activeSubscriptionsQuery = query(subscriptionsRef, where("status", "==", "active"));
        const activeSubscriptionsSnap = await getDocs(activeSubscriptionsQuery);

        if (activeSubscriptionsSnap.empty) {
            return res.status(404).json({ error: "No active subscription found." });
        }

        const subscriptionId = activeSubscriptionsSnap.docs[0].id;
        console.log(`✅ Found Active Subscription ID: ${subscriptionId}`);

        // ✅ Fetch Subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // ✅ Check if it's already set to cancel
        if (!subscription.cancel_at_period_end) {
            return res.status(400).json({ error: "Subscription is not set to cancel." });
        }

        // ✅ Resume Subscription in Stripe
        const resumedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
        });

        console.log(`✅ Subscription resumed for UID: ${uid}`);
        res.json({ message: "Subscription resumed successfully!", resumedSubscription });

    } catch (error) {
        console.error("❌ Subscription resumption failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * ✅ Reactivate Subscription After Full Cancellation
 * Creates a new subscription for users who want to return.
 */
router.post("/reactivate", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { priceId } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: "Missing required parameters." });
        }

        console.log(`🔹 Reactivating subscription for UID: ${uid} → Price ID: ${priceId}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe Customer ID missing." });
        }

        // ✅ Create New Subscription in Stripe
        const newSubscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            expand: ["latest_invoice.payment_intent"],
        });

        console.log(`✅ New Subscription Created for UID: ${uid}`);

        // ✅ Update Firestore with New Subscription Tier
        await updateDoc(userRef, { subscriptionTier: priceId });

        res.json({ message: "Subscription reactivated successfully!", newSubscription });

    } catch (error) {
        console.error("❌ Subscription reactivation failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});


/**
 * ✅ Retrieve User's Invoices (Billing History)
 * Fetches all invoices for a user's Stripe customer ID.
 */
router.get("/invoices", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;

        console.log(`🔹 Fetching invoices for UID: ${uid}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe Customer ID missing." });
        }

        // ✅ Fetch Invoices from Stripe
        const invoices = await stripe.invoices.list({ customer: stripeCustomerId });

        res.json({ invoices: invoices.data });

    } catch (error) {
        console.error("❌ Error fetching invoices:", error.message);
        res.status(500).json({ error: error.message });
    }
});


/**
 * ✅ Retrieve User's Invoices (Billing History)
 * Fetches all invoices for a user's Stripe customer ID.
 */
router.get("/invoices", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;

        console.log(`🔹 Fetching invoices for UID: ${uid}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe Customer ID missing." });
        }

        // ✅ Fetch Invoices from Stripe
        const invoices = await stripe.invoices.list({ customer: stripeCustomerId });

        res.json({ invoices: invoices.data });

    } catch (error) {
        console.error("❌ Error fetching invoices:", error.message);
        res.status(500).json({ error: error.message });
    }
});


/**
 * ✅ Refund a Payment
 * Refunds a user's most recent charge (or a specific one).
 */
router.post("/refund", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { chargeId } = req.body; // If no chargeId provided, refund last payment.

        if (!chargeId) {
            return res.status(400).json({ error: "Missing charge ID." });
        }

        console.log(`🔹 Processing refund for UID: ${uid} → Charge ID: ${chargeId}`);

        // ✅ Refund the Payment in Stripe
        const refund = await stripe.refunds.create({ charge: chargeId });

        res.json({ message: "Refund processed successfully!", refund });

    } catch (error) {
        console.error("❌ Refund failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});


/**
 * ✅ Change Subscription Billing Cycle Date
 * Moves the next billing date for a user's subscription.
 */
router.post("/change-billing-date", verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { newBillingDate } = req.body;

        if (!newBillingDate) {
            return res.status(400).json({ error: "Missing new billing date." });
        }

        console.log(`🔹 Changing billing date for UID: ${uid} → New Date: ${newBillingDate}`);

        // ✅ Fetch User Document
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userSnap.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: "Stripe Customer ID missing." });
        }

        // ✅ Fetch Active Subscription
        const subscriptionsRef = collection(db, "customers", uid, "subscriptions");
        const activeSubscriptionsQuery = query(subscriptionsRef, where("status", "==", "active"));
        const activeSubscriptionsSnap = await getDocs(activeSubscriptionsQuery);

        if (activeSubscriptionsSnap.empty) {
            return res.status(404).json({ error: "No active subscription found." });
        }

        const subscriptionId = activeSubscriptionsSnap.docs[0].id;

        // ✅ Change Billing Cycle in Stripe
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            billing_cycle_anchor: newBillingDate,
            proration_behavior: "none",
        });

        res.json({ message: "Billing date changed successfully!", updatedSubscription });

    } catch (error) {
        console.error("❌ Billing date change failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});





export default router;
