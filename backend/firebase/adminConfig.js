import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: "./.env" });

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

// ✅ Export Firestore and Auth
export const db = getFirestore();
export const auth = admin.auth();
