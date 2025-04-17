import admin from "firebase-admin"; // ✅ Fix import
import { getFirestore} from "firebase-admin/firestore"; // ✅ Use Firestore Admin SDK


// ✅ Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const db = getFirestore(); // ✅ Initialize Firestore


const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
        }

        const idToken = authHeader.split("Bearer ")[1]; // Extract token
        console.log("Received Firebase Token:", idToken);

        // 🔹 Verify Firebase Auth Token
        const auth = admin.auth()
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid; // Extract user ID from token
        console.log("Verified Firebase UID:", userId);

        // 🔹 Fetch user document from Firestore
        const userRef = db.doc(`users/${userId}`); // ✅ Correct Firestore Admin SDK syntax        const userSnap = await getDoc(userRef); // ✅ Fetch document
        const userSnap = await userRef.get(); // ✅ Fetch document
        
        if (!userSnap.exists) {
            console.error("User document not found for UID:", userId);
            return res.status(404).json({ error: "User not found in Firestore" });
        }

        const userData = userSnap.data(); // ✅ Extract data
        console.log("User document data:", userData);

        // 🔹 Ensure `stripeCustomerId` exists
        if (!userData.stripeCustomerId) {
            console.error("❌ Stripe Customer ID is missing for UID:", userId);
            return res.status(400).json({ error: "No Stripe customer found for this user" });
        }

        // 🔹 Attach user data to request
        req.user = {
            uid: userId,
            stripeCustomerId: userData.stripeCustomerId,
            email: userData.email,
            subscriptionTier: userData.subscriptionTier || "free",
        };

        next(); // Proceed to next middleware or route

    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

export default verifyFirebaseToken;