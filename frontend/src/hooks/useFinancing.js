// src/hooks/useFinancing.js
import { usePropertySection } from "./usePropertySection";
import { fetchFinancing, saveFinancingData } from "@/domain/financing";

export const useFinancing = (uid, propertyId) =>
  usePropertySection(uid, propertyId, fetchFinancing, saveFinancingData);
