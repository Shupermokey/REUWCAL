import {
  getPurchasePrice,
  savePurchasePrice,
} from "@/services/firestore/purchasePriceService";

export async function loadPurchasePrice(uid, propertyId) {
  return (await getPurchasePrice(uid, propertyId)) || {
    purchasePrice: 0,
    pricePerUnit: 0,
  };
}

export async function savePurchasePriceData(uid, propertyId, data) {
  await savePurchasePrice(uid, propertyId, data);
}
