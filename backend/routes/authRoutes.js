import express from "express";
import { auth, db } from "../firebase/adminConfig.js"; // ✅ Uses Firebase Admin SDK
import { stripe } from "../services/stripeService.js";

const router = express.Router();

// ✅ Register User API
router.post("/register", async (req, res) => {
  try {
    const { email, uid, tier } = req.body; // 🔹 Expect UID from frontend (Firebase Auth)
   
    if (!email || !uid || !tier) {
        return res.status(400).json({ error: "Missing required fields." });
      }

    // 🔹 Check if user already exists in Firestore
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      return res.status(400).json({ error: "User already exists." });
    }


    // ✅ Create Stripe Customer
    const customer = await stripe.customers.create({
      email,
      metadata: { uid },
    });
    console.log(`✅ Stripe customer created: ${customer.id}`);

    // ✅ Store user in Firestore (Using Firebase Admin SDK)
    await db
      .collection("users")
      .doc(uid)
      .set({
        email,
        stripeCustomerId: customer.id,
        subscriptionTier: tier || "free",
        createdAt: new Date().toISOString(),
      });

    res
      .status(201)
      .json({
        message: "User registered successfully!",
        uid,
        stripeCustomerId: customer.id,
      });
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/create-stripe-customer", async (req, res) => {
  try {
    const { uid, email } = req.body;
    if (!uid || !email)
      return res.status(400).json({ error: "Missing UID or Email" });

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    // ✅ If user does not exist, create it in Firestore
    if (!userSnap.exists) {
      console.warn(
        `⚠️ User not found in Firestore. Creating document for UID: ${uid}`
      );
      await userRef.set({
        email,
        subscriptionTier: "free", // Default to free
        stripeCustomerId: null,
        createdAt: new Date().toISOString(),
        emailVerified: false,
      });
    }

    // ✅ Create Stripe Customer
    const customer = await stripe.customers.create({
      email,
      metadata: { uid },
    });
    console.log(`✅ Created Stripe Customer: ${customer.id}`);

    res.json({ stripeCustomerId: customer.id });
  } catch (error) {
    console.error("❌ Stripe Customer Creation Failed:", error.message);
    res.status(500).json({ error: "Stripe customer creation failed." });
  }
});

export default router;
