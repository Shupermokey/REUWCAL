import {
  getZoningCategories,
  getZoningCategory,
  saveZoningCategory,
  deleteZoningCategory,
  getZoningSubtypes,
  addZoningSubtype,
  saveZoningSubtype,
  deleteZoningSubtype,
  mergeDefaultZoningCategories,
} from "@/services/firestore/zoningService";

/**
 * Ensure default zoning categories exist.
 */
export async function initializeZoningDefaults(uid) {
  await mergeDefaultZoningCategories(uid);
}

/**
 * Get all zoning categories.
 */
export async function loadZoningCategories(uid) {
  return await getZoningCategories(uid);
}

/**
 * Get single zoning category.
 */
export async function loadZoningCategory(uid, categoryId) {
  return await getZoningCategory(uid, categoryId);
}

/**
 * Save category changes.
 */
export async function saveZoningCategoryData(uid, categoryId, data) {
  await saveZoningCategory(uid, categoryId, data);
}

/**
 * Delete zoning category.
 */
export async function removeZoningCategory(uid, categoryId) {
  await deleteZoningCategory(uid, categoryId);
}

/**
 * Get all subtypes under a given category.
 */
export async function loadZoningSubtypes(uid, categoryLabel) {
  return await getZoningSubtypes(uid, categoryLabel);
}

/**
 * Add a new subtype.
 */
export async function createZoningSubtype(uid, categoryLabel, data) {
  return await addZoningSubtype(uid, categoryLabel, data);
}

/**
 * Save subtype data.
 */
export async function saveZoningSubtypeData(uid, categoryLabel, subtypeId, data) {
  await saveZoningSubtype(uid, categoryLabel, subtypeId, data);
}

/**
 * Delete subtype.
 */
export async function removeZoningSubtype(uid, categoryLabel, subtypeId) {
  await deleteZoningSubtype(uid, categoryLabel, subtypeId);
}
