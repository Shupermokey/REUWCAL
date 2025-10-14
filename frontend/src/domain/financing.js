import { getFinancing, saveFinancing } from "@/services/firestore/financingService";
import { PROPERTY_SECTIONS } from "@/constants";

export const fetchFinancing = async (uid, propertyId) => {
  return await getFinancing(uid, propertyId);
};

export const saveFinancingData = async (uid, propertyId, data) => {
  return await saveFinancing(uid, propertyId, data);
};

export const getFinancingShape = () => ({
  section: PROPERTY_SECTIONS.FINANCING,
  loanAmount: 0,
  interestRate: 0,
  termYears: 0,
  amortization: 0,
});
