import { getPropertyTaxes, savePropertyTaxes } from "@/services/firestore/propertyTaxesService";
import { PROPERTY_SECTIONS } from "@/constants";

export const fetchPropertyTaxes = async (uid, propertyId) => {
  return await getPropertyTaxes(uid, propertyId);
};

export const savePropertyTaxesData = async (uid, propertyId, data) => {
  return await savePropertyTaxes(uid, propertyId, data);
};

export const getPropertyTaxesShape = () => ({
  section: PROPERTY_SECTIONS.PROPERTY_TAXES,
  pins: [],
  totalAmount: 0,
  breakdown: {},
});
