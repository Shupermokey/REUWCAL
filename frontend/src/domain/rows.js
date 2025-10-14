import {
  addRow,
  getRowsByProperty,
  updateRow,
  deleteRow,
} from "@/services/firestore/rowsService";

export const fetchRows = async (uid, propertyId) => await getRowsByProperty(uid, propertyId);
export const createRow = async (uid, propertyId, data) => await addRow(uid, propertyId, data);
export const updateRowData = async (uid, propertyId, rowId, updates) =>
  await updateRow(uid, propertyId, rowId, updates);
export const removeRow = async (uid, propertyId, rowId) =>
  await deleteRow(uid, propertyId, rowId);

export const getRowShape = () => ({
  id: "",
  category: "",
  data: {},
  createdAt: null,
  updatedAt: null,
});
