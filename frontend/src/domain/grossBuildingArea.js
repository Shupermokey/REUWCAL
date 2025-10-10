import {
  getGrossBuildingArea,
  saveGrossBuildingArea,
} from "@/services/firestore/grossBuildingAreaService";

export async function loadGrossBuildingArea(uid, propertyId) {
  return (await getGrossBuildingArea(uid, propertyId)) || {
    totalSqFt: 0,
    rentableSqFt: 0,
    efficiencyRatio: 0,
  };
}

export async function saveGrossBuildingAreaData(uid, propertyId, data) {
  await saveGrossBuildingArea(uid, propertyId, data);
}
