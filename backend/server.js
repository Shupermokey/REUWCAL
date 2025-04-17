// import express from "express";
// import Stripe from "stripe";
// import cors from "cors";
// import bodyParser from "body-parser";
// import { config } from "dotenv";
// import verifyFirebaseToken from "./src/util.js";
// import { db } from "./src/firebase/backend/firebaseConfig.js";
// import asyncHandler from "express-async-handler";

// config();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const app = express();
// app.use(bodyParser.json()); // Parse JSON request bodies


// // Middleware
// app.use(
//   cors({
//     origin: "http://localhost:5173", // Ensure this matches your frontend's origin
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Include allowed methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Ensure Authorization header is allowed
//   })
// );

// // Define your price IDs from Stripe Dashboard. Make sure to update this in .env with non-test values
// const PRICE_IDS = {
//   free: null, // No price for free tier
//   marketing: "price_1QefkuEgiGJZMTseD5g4kb1K",
//   developer: "price_1QeflXEgiGJZMTsepoBPEblg",
//   syndicator: "price_1QefmEEgiGJZMTsedxiwooup",
// };

// const PRICE_IDS_REVERSE = {
//   free: null, // No price for free tier
//   price_1QefkuEgiGJZMTseD5g4kb1K: "marketing",
//   price_1QeflXEgiGJZMTsepoBPEblg: "developer",
//   price_1QefmEEgiGJZMTsedxiwooup: "syndicator",
// };

// app.post(
//   "/create-checkout-session",
//   verifyFirebaseToken,
//   asyncHandler(async (req, res) => {
//     const { uid, stripeCustomerId, subscriptionTier } = req.user;
//     console.log(`✅ Processing checkout for UID: ${uid}`);

//     const priceId = PRICE_IDS[subscriptionTier];
//     if (!priceId) return res.status(400).json({ error: "Invalid subscription tier" });

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "subscription",
//       customer: stripeCustomerId,
//       line_items: [{ price: priceId, quantity: 1 }],
//       success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
//       cancel_url: "http://localhost:5173/cancel",
//     });

//     console.log(`✅ Stripe Checkout session created: ${session.url}`);
//     res.json({ checkoutUrl: session.url });
//   })
// );

// app.post(
//   "/api/update-subscription",
//   verifyFirebaseToken,
//   asyncHandler(async (req, res) => {
//     const { uid } = req.user;
//     const { newPriceId } = req.body;

//     if (!newPriceId) return res.status(400).json({ error: "Missing newPriceId" });

//     console.log(`🔹 Updating subscription for UID: ${uid}`);

//     // ✅ Fetch Firestore User Document
//     const userRef = db.collection("users").doc(uid);
//     const userSnap = await userRef.get();
//     if (!userSnap.exists) return res.status(404).json({ error: "User not found in Firestore." });

//     const { stripeCustomerId } = userSnap.data();
//     console.log(`✅ Found Stripe Customer ID: ${stripeCustomerId}`);

//     // ✅ Fetch Active Subscription
//     const subscriptionsRef = db.collection("customers").doc(uid).collection("subscriptions");
//     const activeSubscriptionsSnap = await subscriptionsRef.where("status", "==", "active").get();
//     if (activeSubscriptionsSnap.empty) return res.status(404).json({ error: "No active subscription found." });

//     const subscriptionId = activeSubscriptionsSnap.docs[0].id;
//     console.log(`✅ Found Active Subscription ID: ${subscriptionId}`);

//     // ✅ Retrieve Current Stripe Subscription
//     const subscription = await stripe.subscriptions.retrieve(subscriptionId);

//     if (subscription.cancel_at_period_end) {
//       // ✅ Remove Cancelation if the user is upgrading
//       await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
//       console.log(`✅ Removed cancel_at_period_end flag for Subscription ID: ${subscriptionId}`);
//     }

//     // ✅ Update Stripe Subscription with Proration (Handles Upgrade/Downgrade Pricing)
//     const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
//       items: [{
//          id: subscription.items.data[0].id,
//          price: newPriceId
//          }],
//       proration_behavior: "create_prorations", // Adjusts billing dynamically
//     });

//     console.log(`✅ Subscription updated in Stripe: ${subscriptionId} → New Price: ${newPriceId}`);

//     // ✅ Sync Updated Subscription to Firestore
//     const subscriptionRef = db.collection("customers").doc(uid).collection("subscriptions").doc(subscriptionId);
//     await subscriptionRef.update({
//       price: newPriceId,
//       product: updatedSubscription.items.data[0].price.product,
//       updatedAt: new Date().toISOString(),
//       status: updatedSubscription.status,
//       metadata: { updatedBy: uid },
//       current_period_start: updatedSubscription.current_period_start,
//       current_period_end: updatedSubscription.current_period_end,
//     });

//     const newSubscriptionTier = PRICE_IDS_REVERSE[newPriceId] || 'free';

//     await userRef.update({ subscriptionTier: newSubscriptionTier });
//     console.log(`✅ Subscription updated in Firestore for UID: ${uid} → New Tier: ${newSubscriptionTier}`);

//     res.json({ message: "Subscription updated successfully." });
//   })
// );


// // // ✅ Update Subscription
// // app.post(
// //   "/api/update-subscription",
// //   verifyFirebaseToken,
// //   asyncHandler(async (req, res) => {
// //     const { uid } = req.user;
// //     const { newPriceId } = req.body;
// //     if (!newPriceId) return res.status(400).json({ error: "Missing required parameters." });

// //     console.log(`🔹 Updating subscription for UID: ${uid}`);

// //     // ✅ Fetch Firestore User Document
// //     const userRef = db.collection("users").doc(uid);
// //     const userSnap = await userRef.get();
// //     if (!userSnap.exists) return res.status(404).json({ error: "User not found in Firestore." });

// //     const { stripeCustomerId } = userSnap.data();
// //     console.log(`✅ Found Stripe Customer ID: ${stripeCustomerId}`);

// //     // ✅ Fetch Active Subscription
// //     const subscriptionsRef = db.collection("customers").doc(uid).collection("subscriptions");
// //     const activeSubscriptionsSnap = await subscriptionsRef.where("status", "==", "active").get();
// //     if (activeSubscriptionsSnap.empty) return res.status(404).json({ error: "No active subscription found." });

// //     const subscriptionId = activeSubscriptionsSnap.docs[0].id;
// //     console.log(`✅ Found Active Subscription ID: ${subscriptionId}`);

// //     // ✅ Update Stripe Subscription
// //     const subscription = await stripe.subscriptions.retrieve(subscriptionId);
// //     const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
// //       items: [{ id: subscription.items.data[0].id, price: newPriceId }],
// //     });

// //     console.log(`✅ Subscription updated in Stripe: ${subscriptionId} → New Price: ${newPriceId}`);

// //     // ✅ Sync Updated Subscription to Firestore
// //     const subscriptionRef = db.collection("customers").doc(uid).collection("subscriptions").doc(subscriptionId);
    
// //     await subscriptionRef.update({
// //       price: newPriceId,
// //       product: updatedSubscription.items.data[0].price.product,
// //       updatedAt: new Date().toISOString(),
// //       status: updatedSubscription.status,
// //       metadata: { updatedBy: uid },
// //       current_period_start: updatedSubscription.current_period_start,
// //       current_period_end: updatedSubscription.current_period_end,
// //     });

// //     console.log(`✅ Subscription updated in Firestore for UID: ${uid}`);
// //     res.json({ message: "Subscription updated successfully." });
// //   })
// // );

// app.post(
//   "/api/update-payment-method",
//   verifyFirebaseToken,
//   asyncHandler(async (req, res) => {
//     const { uid } = req.user;
//     const { paymentMethodId } = req.body;

//     if (!paymentMethodId) return res.status(400).json({ error: "Missing payment method ID" });

//     console.log(`🔹 Updating payment method for UID: ${uid}`);

//     // ✅ Fetch Firestore User Document
//     const userRef = db.collection("users").doc(uid);
//     const userSnap = await userRef.get();
//     if (!userSnap.exists) return res.status(404).json({ error: "User not found in Firestore." });

//     const { stripeCustomerId } = userSnap.data();
//     console.log(`✅ Found Stripe Customer ID: ${stripeCustomerId}`);

//     // ✅ Attach the Payment Method to the Customer
// await stripe.paymentMethods.attach(paymentMethodId, {
//   customer: stripeCustomerId,
// });

//     // ✅ Update Payment Method in Stripe
//     await stripe.customers.update(stripeCustomerId, {
//       invoice_settings: { default_payment_method: paymentMethodId },
//     });

//     res.json({ message: "Payment method updated successfully." });
//   })
// );


// app.post(
//   "/api/cancel-subscription",
//   verifyFirebaseToken,
//   asyncHandler(async (req, res) => {
//     const { uid } = req.user;

//     console.log(`🔹 Cancelling subscription for UID: ${uid}`);

//     // ✅ Fetch Active Subscription
//     const subscriptionsRef = db.collection("customers").doc(uid).collection("subscriptions");
//     const activeSubscriptionsSnap = await subscriptionsRef.where("status", "==", "active").get();
//     if (activeSubscriptionsSnap.empty) return res.status(404).json({ error: "No active subscription found." });

//     const subscriptionId = activeSubscriptionsSnap.docs[0].id;
//     console.log(`✅ Found Active Subscription ID: ${subscriptionId}`);

//     // ✅ Cancel Subscription at End of Billing Period
//     await stripe.subscriptions.update(subscriptionId, {
//       cancel_at_period_end: true,
//     });

//     res.json({ message: "Subscription cancellation scheduled." });
//   })
// );

// // ✅ Start Server
// app.listen(4000, () => console.log("🚀 Server running on port 4000"));


import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import { config } from "dotenv";
import { auth, db } from "./firebase/adminConfig.js";
import { stripe } from "./services/stripeService.js";
import stripeWebhook from "./routes/stripeWebhook.js";

config();
const app = express();

app.use("/webhook", express.raw({ type: "application/json" }), stripeWebhook);


app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);


app.get("/api/test-firestore", async (req, res) => {
  try {
      const testDocRef = db.collection("test").doc("check");
      await testDocRef.set({ message: "Firestore is working!" });

      const docSnap = await testDocRef.get();
      const data = docSnap.data();

      res.json({ message: "✅ Firestore Connection Successful!", data });
  } catch (error) {
      console.error("❌ Firestore Connection Failed:", error.message);
      res.status(500).json({ error: "Firestore connection failed" });
  }
});


app.get("/api/test-stripe", async (req, res) => {
  try {
      const productList = await stripe.products.list({ limit: 5 });

      res.json({
          message: "✅ Stripe Connection Successful!",
          products: productList.data.map(p => p.name),
      });
  } catch (error) {
      console.error("❌ Stripe Connection Failed:", error.message);
      res.status(500).json({ error: "Stripe connection failed" });
  }
});

app.get("/api/test-auth", async (req, res) => {
  try {
      const userList = await auth.listUsers(3); // Get first 3 users

      res.json({
          message: "✅ Firebase Auth Connection Successful!",
          users: userList.users.map(user => user.email),
      });
  } catch (error) {
      console.error("❌ Firebase Auth Connection Failed:", error.message);
      res.status(500).json({ error: "Firebase Auth connection failed" });
  }
});



app.listen(4000, () => console.log("🚀 Backend running on port 4000"));

