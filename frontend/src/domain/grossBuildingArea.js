import { getGrossBuildingArea, saveGrossBuildingArea } from "@/services/firestore/grossBuildingAreaService";
import { PROPERTY_SECTIONS } from "@/constants";

export const fetchGrossBuildingArea = async (uid, propertyId) => {
  return await getGrossBuildingArea(uid, propertyId);
};

export const saveGrossBuildingAreaData = async (uid, propertyId, data) => {
  return await saveGrossBuildingArea(uid, propertyId, data);
};

export const getGrossBuildingAreaShape = () => ({
  section: PROPERTY_SECTIONS.GROSS_BUILDING_AREA,
  gba: 0,
  gla: 0,
  nra: 0,
  documents: [],
});
