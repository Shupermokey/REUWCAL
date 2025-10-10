import {
  getIncomeStatement,
  saveIncomeStatement,
} from "@/services/firestore/incomeStatementService";

/**
 * Load the income statement for a property.
 */
export async function loadIncomeStatement(uid, propertyId) {
  const data = await getIncomeStatement(uid, propertyId);
  return (
    data || {
      Income: {},
      Expenses: {},
      Totals: {},
    }
  );
}

/**
 * Save or update the income statement.
 */
export async function saveIncomeStatementData(uid, propertyId, updates) {
  await saveIncomeStatement(uid, propertyId, updates);
}

/**
 * Reset income statement to default structure.
 */
export async function resetIncomeStatement(uid, propertyId) {
  const defaults = {
    Income: {},
    Expenses: {},
    Totals: {},
    updatedAt: new Date().toISOString(),
  };
  await saveIncomeStatement(uid, propertyId, defaults);
  return defaults;
}
