import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const path = (uid, pid) =>
  doc(db, "users", uid, "properties", pid, "propertyTaxes", "current");

/**
 * Get the property taxes document for a given property.
 */
export const getPropertyTaxes = async (uid, pid) => {
  const snap = await getDoc(path(uid, pid));
  return snap.exists() ? snap.data() : null;
};

/**
 * Save or update the property taxes document.
 */
export const savePropertyTaxes = async (uid, pid, data) => {
  await setDoc(path(uid, pid), data, { merge: true });
};
