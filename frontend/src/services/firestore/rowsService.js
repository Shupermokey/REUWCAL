import { db } from "../firebaseConfig";
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export const addRow = async (uid, propertyId, data) => {
  const colRef = collection(db, `users/${uid}/properties/${propertyId}/rows`);
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

export const getRows = async (uid, propertyId) => {
  const colRef = collection(db, `users/${uid}/properties/${propertyId}/rows`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateRow = async (uid, propertyId, rowId, data) => {
  const ref = doc(db, `users/${uid}/properties/${propertyId}/rows/${rowId}`);
  await updateDoc(ref, data);
};

export const deleteRow = async (uid, propertyId, rowId) => {
  const ref = doc(db, `users/${uid}/properties/${propertyId}/rows/${rowId}`);
  await deleteDoc(ref);
};
