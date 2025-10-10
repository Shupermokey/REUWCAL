import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const path = (uid, pid) =>
  doc(db, "users", uid, "properties", pid, "grossBuildingArea", "current");

/**
 * Get the gross building area document for a property.
 */
export const getGrossBuildingArea = async (uid, pid) => {
  const snap = await getDoc(path(uid, pid));
  return snap.exists() ? snap.data() : null;
};

/**
 * Save or update gross building area data.
 */
export const saveGrossBuildingArea = async (uid, pid, data) => {
  await setDoc(path(uid, pid), data, { merge: true });
};
