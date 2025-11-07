import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultPurchasePrice } from "@/utils/purchasePrice/purchasePriceDefaults";

/**
 * Get purchase price data for a specific property
 */
export async function getPurchasePrice(userId, propertyId) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "purchasePrice");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default structure if doesn't exist
      return defaultPurchasePrice();
    }
  } catch (error) {
    console.error("Error getting purchase price:", error);
    throw error;
  }
}

/**
 * Save purchase price data
 */
export async function savePurchasePrice(userId, propertyId, data) {
  try {
    const docRef = doc(db, "users", userId, "properties", propertyId, "details", "purchasePrice");
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving purchase price:", error);
    throw error;
  }
}
