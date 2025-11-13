import { db } from "../firebaseConfig";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, serverTimestamp, onSnapshot, orderBy, query
} from "firebase/firestore";

export const getProperties = async (userId) => {
  const colRef = collection(db, `users/${userId}/properties`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addProperty = async (userId, data) => {
  const colRef = collection(db, `users/${userId}/properties`);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateProperty = async (userId, propertyId, data) => {
  const docRef = doc(db, `users/${userId}/properties/${propertyId}`);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteProperty = async (userId, propertyId) => {
  const docRef = doc(db, `users/${userId}/properties/${propertyId}`);
  await deleteDoc(docRef);
};

export const subscribeToProperties = (userId, callback, onError = console.error) => {
  const q = query(collection(db, `users/${userId}/properties`), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  }, onError);
};
