import { db } from "../firebaseConfig";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { FIRESTORE_PATHS } from "@/constants";

export const getBaselines = async (uid) => {
  const colRef = collection(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBaseline = async (uid, baselineId) => {
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES, baselineId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const saveBaseline = async (uid, baselineId, data) => {
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES, baselineId);
  await setDoc(ref, data, { merge: true });
};

export const deleteBaseline = async (uid, baselineId) => {
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES, baselineId);
  await deleteDoc(ref);
};
