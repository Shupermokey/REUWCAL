import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const path = (uid, pid) =>
  doc(db, "users", uid, "properties", pid, "financing", "current");

/**
 * Get the financing document for a property.
 */
export const getFinancing = async (uid, pid) => {
  const snap = await getDoc(path(uid, pid));
  return snap.exists() ? snap.data() : null;
};

/**
 * Save or update financing data.
 */
export const saveFinancing = async (uid, pid, data) => {
  await setDoc(path(uid, pid), data, { merge: true });
};
