// src/hooks/useGrossSiteArea.js
import { usePropertySection } from "./usePropertySection";
import { fetchGrossSiteArea, saveGrossSiteAreaData } from "@/domain/grossSiteArea";

export const useGrossSiteArea = (uid, propertyId) =>
  usePropertySection(uid, propertyId, fetchGrossSiteArea, saveGrossSiteAreaData);
