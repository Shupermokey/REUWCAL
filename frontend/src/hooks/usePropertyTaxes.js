// src/hooks/usePropertyTaxes.js
import { usePropertySection } from "./usePropertySection";
import { fetchPropertyTaxes, savePropertyTaxesData } from "@/domain/propertyTaxes";

export const usePropertyTaxes = (uid, propertyId) =>
  usePropertySection(uid, propertyId, fetchPropertyTaxes, savePropertyTaxesData);
