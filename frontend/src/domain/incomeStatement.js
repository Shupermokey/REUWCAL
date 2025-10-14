import { getIncomeStatement, saveIncomeStatement } from "@/services/firestore/incomeStatementService";
import { PROPERTY_SECTIONS } from "@/constants";

export const fetchIncomeStatement = async (uid, propertyId) => {
  return await getIncomeStatement(uid, propertyId);
};

export const saveIncomeStatementData = async (uid, propertyId, data) => {
  return await saveIncomeStatement(uid, propertyId, data);
};

export const getIncomeStatementShape = () => ({
  section: PROPERTY_SECTIONS.INCOME_STATEMENT,
  Income: {},
  Expenses: {},
  CashFlow: {},
});
