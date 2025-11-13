import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultGrossSiteArea } from "@/utils/grossSiteArea/grossSiteAreaDefaults";

/**
 * Get gross site area data for a specific property
 */
export async function getGrossSiteArea(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "grossSiteArea");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultGrossSiteArea();
    }
  } catch (error) {
    console.error("Error getting gross site area:", error);
    throw error;
  }
}

/**
 * Save gross site area data
 */
export async function saveGrossSiteArea(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "grossSiteArea");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving gross site area:", error);
    throw error;
  }
}
