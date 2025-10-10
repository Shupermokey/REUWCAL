import {
  getRows,
  addRow,
  updateRow,
  deleteRow,
} from "@/services/firestore/rowsService";

/**
 * Load all rows for a property.
 */
export async function loadRows(uid, propertyId) {
  return await getRows(uid, propertyId);
}

/**
 * Add a new row to property.
 */
export async function createRow(uid, propertyId, data) {
  return await addRow(uid, propertyId, data);
}

/**
 * Update a specific row.
 */
export async function saveRow(uid, propertyId, rowId, updates) {
  await updateRow(uid, propertyId, rowId, updates);
}

/**
 * Delete a row.
 */
export async function removeRow(uid, propertyId, rowId) {
  await deleteRow(uid, propertyId, rowId);
}
