import { auth } from "../firebase/adminConfig.js";

export const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);

        req.user = { uid: decodedToken.uid, email: decodedToken.email };
        next();
    } catch (error) {
        console.error("❌ Authentication Error:", error.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};
