// src/services/firestore/rowsService.js
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/* ────────────────────────────────
   🏠 PROPERTY ROWS (nested under each property)
   users/{uid}/properties/{propertyId}/rows/{rowId}
──────────────────────────────── */

export const addRow = async (uid, propertyId, data) => {
  const colRef = collection(db, `users/${uid}/properties/${propertyId}/rows`);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRows = async (uid, propertyId) => {
  const colRef = collection(db, `users/${uid}/properties/${propertyId}/rows`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateRow = async (uid, propertyId, rowId, data) => {
  const ref = doc(db, `users/${uid}/properties/${propertyId}/rows/${rowId}`);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteRow = async (uid, propertyId, rowId) => {
  const ref = doc(db, `users/${uid}/properties/${propertyId}/rows/${rowId}`);
  await deleteDoc(ref);
};

/* ────────────────────────────────
   ⚙️ DIRECT PROPERTY SAVE
   Some sections (like IncomeStatement) edit data
   at the property level instead of inside /rows.
──────────────────────────────── */

export const saveRowData = async (uid, propertyId, data) => {
  const ref = doc(db, `users/${uid}/properties/${propertyId}`);
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
