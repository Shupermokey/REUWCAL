import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

/* ──────────────────────────────────────────────
   🏷️ ZONING CATEGORIES
   users/{uid}/zoningCategories/{categoryId}
─────────────────────────────────────────────── */


const DEFAULT_CATEGORIES = {
  Commercial: ["Office", "Industrial", "Retail", "Special Use", "OTHER"],
  Residential: ["Single Family", "Multi Family", "Mixed Use", "OTHER"],
};

export const getZoningCategories = async (uid) => {
  const colRef = collection(db, `users/${uid}/zoningCategories`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getZoningCategory = async (uid, categoryId) => {
  const ref = doc(db, `users/${uid}/zoningCategories/${categoryId}`);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const saveZoningCategory = async (uid, categoryId, data) => {
  const ref = doc(db, `users/${uid}/zoningCategories/${categoryId}`);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const addZoningCategory = async (uid, data) => {
  const colRef = collection(db, `users/${uid}/zoningCategories`);
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

export const deleteZoningCategory = async (uid, categoryId) => {
  const ref = doc(db, `users/${uid}/zoningCategories/${categoryId}`);
  await deleteDoc(ref);
};

/* ──────────────────────────────────────────────
   🧩 ZONING SUBTYPES
   users/{uid}/zoningSubtypes/{categoryLabel}/{subtypeId}
─────────────────────────────────────────────── */

export const getZoningSubtypes = async (uid, categoryLabel) => {
  const colRef = collection(db, `users/${uid}/zoningSubtypes/${categoryLabel}`);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addZoningSubtype = async (uid, categoryLabel, data) => {
  const colRef = collection(db, `users/${uid}/zoningSubtypes/${categoryLabel}`);
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

export const saveZoningSubtype = async (uid, categoryLabel, subtypeId, data) => {
  const ref = doc(db, `users/${uid}/zoningSubtypes/${categoryLabel}/${subtypeId}`);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteZoningSubtype = async (uid, categoryLabel, subtypeId) => {
  const ref = doc(db, `users/${uid}/zoningSubtypes/${categoryLabel}/${subtypeId}`);
  await deleteDoc(ref);
};


/**
 * Ensure default zoning categories ("Commercial", "Residential") exist in Firestore
 * for a given user. Merges missing defaults if they’re not present.
 */
export async function mergeDefaultZoningCategories(uid) {
  const catCol = collection(db, `users/${uid}/zoningCategories`);
  const catSnap = await getDocs(catCol);
  const existing = new Set(catSnap.docs.map((d) => d.data().label));

  for (const [label, subtypes] of Object.entries(DEFAULT_CATEGORIES)) {
    // Create category if missing
    if (!existing.has(label)) {
      const ref = doc(db, `users/${uid}/zoningCategories/${label}`);
      await setDoc(ref, {
        label,
        createdAt: serverTimestamp(),
        isDefault: true,
      });
    }

    // Ensure default subtypes exist
    const subtypeCol = collection(db, `users/${uid}/zoningSubtypes/${label}`);
    const subtypeSnap = await getDocs(subtypeCol);
    const existingSubs = new Set(subtypeSnap.docs.map((d) => d.data().name));

    for (const subtype of subtypes) {
      if (!existingSubs.has(subtype)) {
        const subRef = doc(db, `users/${uid}/zoningSubtypes/${label}/${subtype}`);
        await setDoc(subRef, {
          name: subtype,
          createdAt: serverTimestamp(),
          isDefault: true,
        });
      }
    }
  }
}

// After user sign-up, inside createUserProfile()
// When loading zoning settings in your CellDetailsPanel, e.g.:
// useEffect(() => {
//   if (user?.uid) mergeDefaultZoningCategories(user.uid);
// }, [user?.uid]);
