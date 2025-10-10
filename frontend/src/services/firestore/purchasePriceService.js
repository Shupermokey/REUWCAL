import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const path = (uid, pid) =>
  doc(db, "users", uid, "properties", pid, "purchasePrice", "current");

/**
 * Get the purchase price document for a property.
 */
export const getPurchasePrice = async (uid, pid) => {
  const snap = await getDoc(path(uid, pid));
  return snap.exists() ? snap.data() : null;
};

/**
 * Save or update purchase price data.
 */
export const savePurchasePrice = async (uid, pid, data) => {
  await setDoc(path(uid, pid), data, { merge: true });
};
