import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { defaultPropertyAddress } from "@/utils/propertyAddress/propertyAddressDefaults";

/**
 * Get property address data for a specific property
 */
export async function getPropertyAddress(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "propertyAddress");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultPropertyAddress();
    }
  } catch (error) {
    console.error("Error getting property address:", error);
    throw error;
  }
}

/**
 * Save property address data
 */
export async function savePropertyAddress(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "propertyAddress");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving property address:", error);
    throw error;
  }
}
