import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const getUserMetadata = async (userId) => {
  const docRef = doc(db, `users/${userId}`);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

export const createUserProfile = async (userId, data) => {
  const docRef = doc(db, `users/${userId}`);
  await setDoc(docRef, { ...data, createdAt: serverTimestamp() }, { merge: true });
};
