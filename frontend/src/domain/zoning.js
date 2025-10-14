import {
  getZoningCategories,
  getZoningSubtypes,
  saveZoningCategory,
  addZoningCategory,
  deleteZoningCategory,
  addZoningSubtype,
  saveZoningSubtype,
  deleteZoningSubtype,
  mergeDefaultZoningCategories,
} from "@/services/firestore/zoningService";

export const fetchZoningCategories = async (uid) => await getZoningCategories(uid);
export const fetchZoningSubtypes = async (uid, label) => await getZoningSubtypes(uid, label);

export const createZoningCategory = async (uid, data) => await addZoningCategory(uid, data);
export const updateZoningCategory = async (uid, id, data) => await saveZoningCategory(uid, id, data);
export const removeZoningCategory = async (uid, id) => await deleteZoningCategory(uid, id);

export const createZoningSubtype = async (uid, label, data) => await addZoningSubtype(uid, label, data);
export const updateZoningSubtype = async (uid, label, id, data) =>
  await saveZoningSubtype(uid, label, id, data);
export const removeZoningSubtype = async (uid, label, id) =>
  await deleteZoningSubtype(uid, label, id);

export const initializeDefaultZoning = async (uid) => await mergeDefaultZoningCategories(uid);
