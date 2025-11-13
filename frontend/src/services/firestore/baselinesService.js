// src/services/firestore/baselinesService.js
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { FIRESTORE_PATHS } from "@/constants";

/**
 * Fetch all baselines for a user (one-time read)
 */
export const getBaselines = async (uid) => {
  if (!uid) return [];
  const colRef = collection(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch a single baseline by ID
 */
export const getBaseline = async (uid, baselineId) => {
  if (!uid || !baselineId) return null;
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES, baselineId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Save or update a baseline (merge mode)
 */
export const saveBaseline = async (uid, baselineId, data) => {
  if (!uid || !baselineId) throw new Error("Missing UID or baselineId");
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES, baselineId);
  await setDoc(ref, data, { merge: true });
};

/**
 * Delete a baseline
 */
export const deleteBaseline = async (uid, baselineId) => {
  if (!uid || !baselineId) throw new Error("Missing UID or baselineId");
  const ref = doc(db, FIRESTORE_PATHS.USERS, uid, FIRESTORE_PATHS.BASELINES, baselineId);
  await deleteDoc(ref);
};

