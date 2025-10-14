import { getPurchasePrice, savePurchasePrice } from "@/services/firestore/purchasePriceService";
import { PROPERTY_SECTIONS } from "@/constants";

export const fetchPurchasePrice = async (uid, propertyId) => {
  return await getPurchasePrice(uid, propertyId);
};

export const savePurchasePriceData = async (uid, propertyId, data) => {
  return await savePurchasePrice(uid, propertyId, data);
};

export const getPurchasePriceShape = () => ({
  section: PROPERTY_SECTIONS.PURCHASE_PRICE,
  contractPrice: 0,
  dueDiligence: 0,
  capitalReserve: 0,
  total: 0,
});
