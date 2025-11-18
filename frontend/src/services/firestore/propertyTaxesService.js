import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultPropertyTaxes } from "@/utils/propertyTaxes/propertyTaxesDefaults";

/**
 * Get property taxes data for a specific property
 */
export async function getPropertyTaxes(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "propertyTaxes");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultPropertyTaxes();
    }
  } catch (error) {
    console.error("Error getting property taxes:", error);
    throw error;
  }
}

/**
 * Save property taxes data
 */
export async function savePropertyTaxes(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "propertyTaxes");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving property taxes:", error);
    throw error;
  }
}
