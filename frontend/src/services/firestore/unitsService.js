import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultUnits } from "@/utils/units/unitsDefaults";

/**
 * Get units data for a specific property
 */
export async function getUnits(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "units");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultUnits();
    }
  } catch (error) {
    console.error("Error getting units:", error);
    throw error;
  }
}

/**
 * Save units data
 */
export async function saveUnits(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "units");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving units:", error);
    throw error;
  }
}
