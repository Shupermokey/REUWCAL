import {
  getFinancing,
  saveFinancing,
} from "@/services/firestore/financingService";

export async function loadFinancing(uid, propertyId) {
  return (await getFinancing(uid, propertyId)) || {
    loanAmount: 0,
    interestRate: 0,
    termYears: 0,
  };
}

export async function saveFinancingData(uid, propertyId, data) {
  await saveFinancing(uid, propertyId, data);
}
