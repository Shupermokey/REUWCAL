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
import { FIRESTORE_PATHS } from "@/constants";

/* ──────────────────────────────────────────────
   🏷️ ZONING CATEGORIES
   users/{uid}/zoningCategories/{categoryId}
─────────────────────────────────────────────── */

const DEFAULT_CATEGORIES = {
  Commercial: ["Office", "Industrial", "Retail", "Special Use", "OTHER"],
  Residential: ["Single Family", "Multi Family", "Mixed Use", "OTHER"],
};

/** 🔹 Get all zoning categories for a user */
export const getZoningCategories = async (uid) => {
  const colRef = collection(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** 🔹 Get a single zoning category */
export const getZoningCategory = async (uid, categoryId) => {
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES, categoryId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** 🔹 Save (create or update) a zoning category */
export const saveZoningCategory = async (uid, categoryId, data) => {
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES, categoryId);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

/** 🔹 Add a new zoning category */
export const addZoningCategory = async (uid, data) => {
  const colRef = collection(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES);
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

/** 🔹 Delete a zoning category */
export const deleteZoningCategory = async (uid, categoryId) => {
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES, categoryId);
  await deleteDoc(ref);
};

/* ──────────────────────────────────────────────
   🧩 ZONING SUBTYPES
   users/{uid}/zoningSubtypes/{categoryLabel}/{subtypeId}
─────────────────────────────────────────────── */

/** 🔹 Get subtypes for a given category */
export const getZoningSubtypes = async (uid, categoryLabel) => {
  const colRef = collection(
    db,
    FIRESTORE_PATHS.USERS,
    uid,
    FIRESTORE_PATHS.ZONING_SUBTYPES,
    categoryLabel
  );
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** 🔹 Add a zoning subtype */
export const addZoningSubtype = async (uid, categoryLabel, data) => {
  const colRef = collection(
    db,
    FIRESTORE_PATHS.USERS,
    uid,
    FIRESTORE_PATHS.ZONING_SUBTYPES,
    categoryLabel
  );
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

/** 🔹 Save (update or create) a zoning subtype */
export const saveZoningSubtype = async (uid, categoryLabel, subtypeId, data) => {
  const ref = doc(
    db,
    FIRESTORE_PATHS.USERS,
    uid,
    FIRESTORE_PATHS.ZONING_SUBTYPES,
    categoryLabel,
    subtypeId
  );
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

/** 🔹 Delete a zoning subtype */
export const deleteZoningSubtype = async (uid, categoryLabel, subtypeId) => {
  const ref = doc(
    db,
    FIRESTORE_PATHS.USERS,
    uid,
    FIRESTORE_PATHS.ZONING_SUBTYPES,
    categoryLabel,
    subtypeId
  );
  await deleteDoc(ref);
};

/* ──────────────────────────────────────────────
   ⚙️ DEFAULT CATEGORY INITIALIZER
─────────────────────────────────────────────── */

/**
 * Ensure default zoning categories ("Commercial", "Residential") exist in Firestore
 * for a given user. Merges missing defaults if they’re not present.
 */
export async function mergeDefaultZoningCategories(uid) {
  const catCol = collection(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES);
  const catSnap = await getDocs(catCol);
  const existing = new Set(catSnap.docs.map((d) => d.data().label));

  for (const [label, subtypes] of Object.entries(DEFAULT_CATEGORIES)) {
    // ✅ Create category if missing
    if (!existing.has(label)) {
      const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.ZONING_CATEGORIES, label);
      await setDoc(ref, {
        label,
        createdAt: serverTimestamp(),
        isDefault: true, // 👈 Enforce protection
      });
    }

    // ✅ Ensure default subtypes exist
    const subtypeCol = collection(
      db,
      FIRESTORE_PATHS.USERS,
      uid,
      FIRESTORE_PATHS.ZONING_SUBTYPES,
      label
    );
    const subtypeSnap = await getDocs(subtypeCol);
    const existingSubs = new Set(subtypeSnap.docs.map((d) => d.data().name));

    for (const subtype of subtypes) {
      if (!existingSubs.has(subtype)) {
        const subRef = doc(
          db,
          FIRESTORE_PATHS.USERS,
          uid,
          FIRESTORE_PATHS.ZONING_SUBTYPES,
          label,
          subtype
        );
        await setDoc(subRef, {
          name: subtype,
          createdAt: serverTimestamp(),
          isDefault: true, // 👈 Protect default subtypes
        });
      }
    }
  }
}
