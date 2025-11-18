import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultGrossBuildingArea } from "@/utils/grossBuildingArea/grossBuildingAreaDefaults";

/**
 * Get gross building area data for a specific property
 */
export async function getGrossBuildingArea(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "grossBuildingArea");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultGrossBuildingArea();
    }
  } catch (error) {
    console.error("Error getting gross building area:", error);
    throw error;
  }
}

/**
 * Save gross building area data
 */
export async function saveGrossBuildingArea(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "grossBuildingArea");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving gross building area:", error);
    throw error;
  }
}
