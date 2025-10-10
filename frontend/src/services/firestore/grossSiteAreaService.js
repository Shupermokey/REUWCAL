import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const path = (uid, pid) =>
  doc(db, "users", uid, "properties", pid, "grossSiteArea", "current");

/**
 * Get the gross site area document for a property.
 */
export const getGrossSiteArea = async (uid, pid) => {
  const snap = await getDoc(path(uid, pid));
  return snap.exists() ? snap.data() : null;
};

/**
 * Save or update gross site area data.
 */
export const saveGrossSiteArea = async (uid, pid, data) => {
  await setDoc(path(uid, pid), data, { merge: true });
};
