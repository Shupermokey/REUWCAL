import {
  getPropertyTaxes,
  savePropertyTaxes,
} from "@/services/firestore/propertyTaxesService";

export async function loadPropertyTaxes(uid, propertyId) {
  return (await getPropertyTaxes(uid, propertyId)) || {
    annualAmount: 0,
    monthlyAmount: 0,
  };
}

export async function savePropertyTaxesData(uid, propertyId, data) {
  await savePropertyTaxes(uid, propertyId, data);
}
