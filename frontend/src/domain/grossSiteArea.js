import {
  getGrossSiteArea,
  saveGrossSiteArea,
} from "@/services/firestore/grossSiteAreaService";

export async function loadGrossSiteArea(uid, propertyId) {
  return (await getGrossSiteArea(uid, propertyId)) || {
    siteSqFt: 0,
    acres: 0,
  };
}

export async function saveGrossSiteAreaData(uid, propertyId, data) {
  await saveGrossSiteArea(uid, propertyId, data);
}
