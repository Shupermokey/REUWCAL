import {
  getProperties,
  addProperty,
  updateProperty,
  deleteProperty,
} from "@/services/firestore/propertiesService";

/**
 * Get all properties for the user.
 */
export async function loadProperties(uid) {
  return await getProperties(uid);
}

/**
 * Create a new property with optional defaults.
 */
export async function createProperty(uid, data = {}) {
  const payload = {
    ...data,
    title: data.title || "Untitled Property",
    createdAt: new Date().toISOString(),
  };
  return await addProperty(uid, payload);
}

/**
 * Update property fields.
 */
export async function saveProperty(uid, propertyId, updates) {
  await updateProperty(uid, propertyId, updates);
}

/**
 * Delete property and its related data.
 */
export async function removeProperty(uid, propertyId) {
  await deleteProperty(uid, propertyId);
}
