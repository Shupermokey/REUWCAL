import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultFinancing } from "@/utils/financing/financingDefaults";

/**
 * Get financing data for a specific property
 */
export async function getFinancing(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "financing");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultFinancing();
    }
  } catch (error) {
    console.error("Error getting financing:", error);
    throw error;
  }
}

/**
 * Save financing data
 */
export async function saveFinancing(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "financing");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving financing:", error);
    throw error;
  }
}
