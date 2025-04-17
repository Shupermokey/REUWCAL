import express from "express";
import { stripe } from "../services/stripeService.js"; // ✅ Uses your existing Stripe service
import { db, auth } from "../firebase/adminConfig.js";
import { getAuth } from 'firebase-admin/auth'
import nodemailer from "nodemailer"; // For sending emails

const router = express.Router();

// 🔹 Webhook Secret from Stripe CLI
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_..."; // ✅ Load from env

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail/SMTP email
      pass: process.env.EMAIL_PASS, // App password for Gmail (or SMTP credentials)
    },
  });

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔹 Received Stripe Webhook: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case "customer.subscription.created":
          await handleSubscriptionCreated(event.data.object);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object);
          break;
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event.data.object);
          break;
        case "payment_intent.failed":
          await handlePaymentFailed(event.data.object);
          break;
        case "payment_intent.canceled":
          await handlePaymentCanceled(event.data.object);
          break;
        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(event.data.object);
          break;
        case "invoice.payment_failed":
          await handlePaymentFailed(event.data.object);
          break;
        case "price.created":
        case "price.updated":
        case "price.deleted":
          await handlePriceChange(event.data.object);
          break;
        case "product.updated":
        case "product.deleted":
          await handleProductChange(event.data.object);
          break;
        // case "customer.created":
        //   await handleCustomerCreated(event.data.object);
        //   break;
        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("❌ Webhook Processing Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// export async function handleCheckoutSessionCompleted(session) {
//     const customerId = session.customer;
//     const email = session.customer_details.email;

//     console.log(`✅ Checkout completed for customer: ${customerId}`);

//     // Check if user exists in Firestore (users collection)
//     const userSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).get();

//     let userId;

//     if (userSnap.empty) {
//         console.warn("⚠️ No matching Firestore user found. Creating user...");

//         // Create Firebase Auth User
//         const userRecord = await auth.createUser({
//             email,
//             emailVerified: true,
//             password: Math.random().toString(36).slice(-8) // Temporary random password
//         });

//         userId = userRecord.uid;
//         console.log(`✅ New Firebase user created: ${userId}`);

//         // Store in Firestore Users Collection
//         await db.collection("users").doc(userId).set({
//             email,
//             stripeCustomerId: customerId,
//             subscriptionStatus: "active",
//             createdAt: new Date().toISOString(),
//         });
//     } else {
//         userId = userSnap.docs[0].id;
//         console.log(`✅ Found existing Firestore user: ${userId}`);
//     }

//     // ✅ Store in Firestore Customers Collection
//     await db.collection("customers").doc(userId).set({
//         email,
//         stripeId: customerId,
//         stripeLink: `https://dashboard.stripe.com/test/customers/${customerId}`
//     });

//     console.log(`✅ Firestore customers/${userId} document created.`);
// }

export async function handleCheckoutSessionCompleted(session) {
  const email = session.customer_email || session.customer_details.email;
  const stripeCustomerId = session.customer; // Existing Stripe customer

  console.log(
    `✅ Checkout completed for customer: ${stripeCustomerId} (${email})`
  );

   // 🔹 Retrieve the session with expanded line items to get priceId
   const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
});

    const priceId = checkoutSession.line_items?.data[0]?.price.id; // ✅ Extract priceId
    const tempPass = Math.random().toString(36).slice(-8);
  // Check if the user already exists in Firebase Auth (to prevent duplicates)
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Firebase user already exists: ${userRecord.uid}`);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // 🚀 Create a new Firebase user and attach Stripe customer ID
      userRecord = await auth.createUser({
        email: email,
        emailVerified: true, // Optional: Auto-verify since they paid
        password: tempPass, // Generate a random password
      });

      console.log(`✅ New Firebase user created: ${userRecord.uid}`);
    } else {
      console.error("❌ Firebase Auth Error:", error);
      return;
    }
  }
  await db.collection("customers").doc(userRecord.uid).set({
    email: email,
    stripeId: stripeCustomerId,
    stripeLink: `https://dashboard.stripe.com/customers/${stripeCustomerId}`
});
console.log(`✅ Firestore customers/${userRecord.uid} document created.`);




  // 🚀 Save user to Firestore WITHOUT triggering a duplicate Stripe customer
  await db.collection("users").doc(userRecord.uid).set({
    email: email,
    stripeCustomerId: stripeCustomerId, // ✅ Attach existing Stripe customer
    subscriptionStatus: "active",
    createdAt: new Date().toISOString(),
    priceId,
  });

  console.log(`✅ User saved in Firestore: ${userRecord.uid}`);


    await sendLoginEmail(email, tempPass);
    await sendMagicLinkEmail(email);
}

async function sendLoginEmail(email, tempPass) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Reuwcal Account Login Details",
        text: `Welcome! You can log in using:\n\nEmail: ${email}\nPassword: ${tempPass}\n\nPlease change your password after logging in.`,
      };
    
      try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Login credentials email sent to ${email}`);
      } catch (error) {
        console.error(`❌ Error sending login email: ${error.message}`);
      }
}

async function sendMagicLinkEmail(email) {
    const auth = getAuth();
    const actionCodeSettings = {
      url: "http://localhost:5173/home", // Adjust for production
      handleCodeInApp: true,
    };
  
    try {
      const link = await auth.generateSignInWithEmailLink(email, actionCodeSettings);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Magic Login Link - Reuwcal",
        text: `Click this link to log in instantly: ${link}`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log(`📧 Magic login link sent to ${email}`);
    } catch (error) {
      console.error(`❌ Error sending magic link: ${error.message}`);
    }
  }


export async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;
  console.log(`🔹 Subscription created for customer: ${customerId}`);

  const userSnap = await db
    .collection("customers")
    .where("stripeId", "==", customerId)
    .get();
  if (userSnap.empty) {
    console.warn("⚠️ No matching customer found in Firestore.");
    return;
  }

  const userId = userSnap.docs[0].id;

  // 🔹 Store subscription under the `subscriptions` subcollection
  const subscriptionRef = db
    .collection("customers")
    .doc(userId)
    .collection("subscriptions")
    .doc(subscription.id);
  await subscriptionRef.set({
    product: subscription.items.data[0].price.product,
    priceId: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    createdAt: new Date().toISOString(),
  });

  console.log(`✅ Subscription stored in Firestore for user: ${userId}`);
}

// export async function handleSubscriptionUpdated(subscription) {
//   const customerId = subscription.customer;
//   console.log(`🔹 Subscription updated for customer: ${customerId}`);

//   // Find the corresponding Firestore customer document
//   const userSnap = await db
//     .collection("customers")
//     .where("stripeId", "==", customerId)
//     .get();
//   if (userSnap.empty) {
//     console.warn("⚠️ No matching customer found in Firestore.");
//     return;
//   }

//   const userId = userSnap.docs[0].id;

//   // Update the specific subscription inside the subscriptions subcollection
//   const subscriptionRef = db
//     .collection("customers")
//     .doc(userId)
//     .collection("subscriptions")
//     .doc(subscription.id);
//   await subscriptionRef.update({
//     priceId: subscription.items.data[0].price.id,
//     status: subscription.status,
//     current_period_start: new Date(
//       subscription.current_period_start * 1000
//     ).toISOString(),
//     current_period_end: new Date(
//       subscription.current_period_end * 1000
//     ).toISOString(),
//     updatedAt: new Date().toISOString(),
//   });

//   console.log(`✅ Subscription updated in Firestore for user: ${userId}`);
// }

export async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0].price.id;
    console.log(`🔹 Subscription updated for customer: ${customerId}`);

    const userSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).get();

    if (!userSnap.empty) {
        const userId = userSnap.docs[0].id;
        await db.collection("users").doc(userId).update({
            priceId,
            subscriptionStatus: subscription.status,
        });

        console.log(`✅ Subscription updated in Firestore for user: ${userId}`);
    }
}

export async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  console.warn(`❌ Subscription canceled for customer: ${customerId}`);

  // Find Firestore customer document
  const userSnap = await db
    .collection("customers")
    .where("stripeId", "==", customerId)
    .get();
  if (userSnap.empty) {
    console.warn("⚠️ No matching customer found in Firestore.");
    return;
  }

  const userId = userSnap.docs[0].id;

  // Mark subscription as canceled in Firestore
  const subscriptionRef = db
    .collection("customers")
    .doc(userId)
    .collection("subscriptions")
    .doc(subscription.id);
  await subscriptionRef.update({ status: "canceled" });

  console.log(`✅ Subscription marked as canceled for user: ${userId}`);
}

export async function handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    console.log(`✅ Payment succeeded for customer: ${customerId}`);
  
    const userSnap = await db
      .collection("customers")
      .where("stripeId", "==", customerId)
      .get();
  
    if (!userSnap.empty) {
      const userId = userSnap.docs[0].id;
  
      const paymentRef = db
        .collection("customers")
        .doc(userId)
        .collection("payments")
        .doc(invoice.id);
  
      const paymentDoc = await paymentRef.get();
  
      if (!paymentDoc.exists) {
        const paymentData = {
          amount_paid: invoice.amount_paid / 100, // Convert cents to dollars
          currency: invoice.currency,
          invoiceId: invoice.id,
          status: invoice.status,
          createdAt: new Date(invoice.created * 1000).toISOString(),
        };
  
        await paymentRef.set(paymentData);
        console.log(`✅ Payment stored in Firestore for user: ${userId}`);
      } else {
        console.log(`⚠️ Payment already exists in Firestore: ${invoice.id}`);
      }
    } else {
      console.warn(`⚠️ No matching Firestore customer found for ${customerId}`);
    }
  }
  

export async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  console.warn(`⚠️ Payment failed for customer: ${customerId}`);

  // Find Firestore customer document
  const userSnap = await db
    .collection("customers")
    .where("stripeId", "==", customerId)
    .get();
  if (userSnap.empty) {
    console.warn("⚠️ No matching customer found in Firestore.");
    return;
  }

  const userId = userSnap.docs[0].id;

  // Mark the subscription as past due
  await db
    .collection("customers")
    .doc(userId)
    .update({ subscriptionStatus: "past_due" });

  console.warn(`⚠️ Subscription marked as past due for user: ${userId}`);
}

export async function handleCustomerCreated(customer) {
    const email = customer.email;
    const stripeCustomerId = customer.id;

    if (!email || !email.includes("@")) {
        console.error("❌ Invalid email received from Stripe:", email);
        return;
    }

    console.log(`🔹 New Stripe customer created: ${stripeCustomerId}, Email: ${email}`);

    let userRecord;
    try {
        // 🚀 Check if Firebase Auth user already exists
        userRecord = await auth.getUserByEmail(email);
        console.log(`✅ Firebase user already exists: ${userRecord.uid}`);

        // 🚀 Update Firestore to link existing user with Stripe
        await db.collection("users").doc(userRecord.uid).set(
            { stripeCustomerId: stripeCustomerId },
            { merge: true }
        );
        console.log(`✅ Linked existing Firebase user with Stripe customer: ${stripeCustomerId}`);
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            // 🚀 Create new Firebase Auth user
            userRecord = await auth.createUser({
                email: email,
                emailVerified: false,
                password: Math.random().toString(36).slice(-8), // Temporary random password
            });

            console.log(`✅ New Firebase user created: ${userRecord.uid}`);

            // 🚀 Save new user to Firestore with Stripe Customer ID
            await db.collection("users").doc(userRecord.uid).set({
                email: email,
                stripeCustomerId: stripeCustomerId,
                createdAt: new Date().toISOString(),
            });

            console.log(`✅ Firestore user linked with Stripe customer: ${stripeCustomerId}`);
        } else {
            console.error("❌ Firebase Auth Error:", error);
            return;
        }
    }
}


export async function handlePriceChange(price) {
  console.log(`🔹 Price updated: ${price.id}`);
}

export async function handleProductChange(product) {
  console.log(`🔹 Product updated: ${product.id}`);
}

export default router;
