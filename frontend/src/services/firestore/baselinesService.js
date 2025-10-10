import { db } from "../firebaseConfig";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export const getBaselines = async (uid) => {
  const colRef = collection(db, `users/${uid}/baselines`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBaseline = async (uid, id) => {
  const ref = doc(db, `users/${uid}/baselines/${id}`);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const saveBaseline = async (uid, id, data) => {
  const ref = doc(db, `users/${uid}/baselines/${id}`);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteBaseline = async (uid, id) => {
  const ref = doc(db, `users/${uid}/baselines/${id}`);
  await deleteDoc(ref);
};

export const subscribeToBaselines = (uid, callback, onError = console.error) => {
  const colRef = collection(db, `users/${uid}/baselines`);
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  }, onError);
};
