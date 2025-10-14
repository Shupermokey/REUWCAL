// src/hooks/usePurchasePrice.js
import { usePropertySection } from "./usePropertySection";
import { fetchPurchasePrice, savePurchasePriceData } from "@/domain/purchasePrice";

export const usePurchasePrice = (uid, propertyId) =>
  usePropertySection(uid, propertyId, fetchPurchasePrice, savePurchasePriceData);
