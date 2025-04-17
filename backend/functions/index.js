import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import functions from 'firebase-functions'
import pkg from "firebase-admin";
import Stripe from "stripe";
import { user } from "firebase-functions/v1/auth";

const admin = pkg;
admin.initializeApp();
const db = admin.firestore();

// Set global options for 1st gen-like behavior
setGlobalOptions({ region: "us-central1", memory: "256MiB", timeoutSeconds: 60 });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "fallback", {
  apiVersion: "2023-10-16",
});

// ✅ Stripe Webhook (v2 modular)
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const subscription = data.object;

  if (
    type === "customer.subscription.updated" ||
    type === "customer.subscription.created"
  ) {
    const uid = subscription.metadata?.uid;
    const priceId = subscription.items.data[0]?.price.id;

    if (!uid || !priceId) {
      console.error("⚠️ Missing UID or Price ID.");
      return res.status(400).send("Missing UID or Price ID.");
    }

    await db.collection("users").doc(uid).update({
      subscriptionTier: priceId,
    });
  }

  if (type === "customer.subscription.deleted") {
    const uid = subscription.metadata?.uid;

    if (!uid) {
      console.error("⚠️ Missing UID.");
      return res.status(400).send("Missing UID.");
    }

    await db.collection("users").doc(uid).update({
      subscriptionTier: "free",
    });
  }

  res.sendStatus(200);
});


export const recursiveDeleteFolder = onCall(async (request) => {
  const { userId, propertyId, folderPath } = request.data;

  if (!userId || !propertyId || !folderPath) {
    console.error("❌ Missing required parameters:", { userId, propertyId, folderPath });
    throw new functions.https.HttpsError("invalid-argument", "Missing required parameters");
  }

  try {
    const basePath = `users/${userId}/properties/${propertyId}/fileSystem/${folderPath}`;
    console.log("📂 Deleting folder tree at:", basePath);

    await deleteFolderTree(basePath);

    console.log("✅ Successfully deleted folder tree at:", basePath);
    return { success: true };
  } catch (err) {
    console.error("❌ Failed to delete folder tree:", err);
    throw new functions.https.HttpsError("internal", "Failed to delete folder tree.");
  }
});


async function deleteFolderTree(folderPath) {
  const folderDocRef = db.doc(folderPath);

  // Delete subfolders
  const foldersRef = folderDocRef.collection("folders");
  const folderSnapshots = await foldersRef.get();

  for (const folderDoc of folderSnapshots.docs) {
    const subfolderPath = `${folderPath}/folders/${folderDoc.id}`;
    await deleteFolderTree(subfolderPath); // recursion into each subfolder
  }

  // Delete files
  const filesRef = folderDocRef.collection("files");
  const fileSnapshots = await filesRef.get();

  for (const fileDoc of fileSnapshots.docs) {
    await fileDoc.ref.delete();
  }

  // Delete the folder doc itself
  await folderDocRef.delete();
}
