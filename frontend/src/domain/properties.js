import {
  getProperties,
  addProperty,
  updateProperty,
  deleteProperty,
} from "@/services/firestore/propertiesService";

export const fetchProperties = async (uid) => await getProperties(uid);
export const createProperty = async (uid, data) => await addProperty(uid, data);
export const updatePropertyData = async (uid, propertyId, data) =>
  await updateProperty(uid, propertyId, data);
export const removeProperty = async (uid, propertyId) =>
  await deleteProperty(uid, propertyId);

export const getPropertyShape = () => ({
  id: "",
  name: "",
  address: "",
  createdAt: null,
  updatedAt: null,
});
