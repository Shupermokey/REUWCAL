/**
 * Default structure for Purchase Price data
 */

/**
 * Calculate total acquisition cost
 */
export const calculateTotalAcquisitionCost = (purchasePriceData) => {
  const {
    contractPrice = 0,
    transactionCosts = 0,
    dueDiligence = 0,
    capitalToStabilize = 0,
    capitalReserve = 0,
    otherExpenses = 0,
  } = purchasePriceData;

  return (
    contractPrice +
    transactionCosts +
    dueDiligence +
    capitalToStabilize +
    capitalReserve +
    otherExpenses
  );
};

/**
 * Default structure for Purchase Price
 */
export const defaultPurchasePrice = () => ({
  contractPrice: 0, // Purchase price
  transactionCosts: 0, // Closing costs, legal fees, etc.
  dueDiligence: 0, // Inspection, appraisal, environmental, etc.
  capitalToStabilize: 0, // Renovation/improvement costs
  capitalToStabilizeTimeframe: "", // e.g., "6 months", "1 year"
  capitalReserve: 0, // Operating reserve
  otherExpenses: 0, // Other acquisition costs
});
