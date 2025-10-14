import { getGrossSiteArea, saveGrossSiteArea } from "@/services/firestore/grossSiteAreaService";
import { PROPERTY_SECTIONS } from "@/constants";

export const fetchGrossSiteArea = async (uid, propertyId) => {
  return await getGrossSiteArea(uid, propertyId);
};

export const saveGrossSiteAreaData = async (uid, propertyId, data) => {
  return await saveGrossSiteArea(uid, propertyId, data);
};

export const getGrossSiteAreaShape = () => ({
  section: PROPERTY_SECTIONS.GROSS_SITE_AREA,
  acres: 0,
  squareFeet: 0,
  documents: [],
});
