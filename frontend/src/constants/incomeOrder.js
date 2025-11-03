// constants/incomeOrder.js
export const INCOME_STRUCTURE = {
  // These are strictly ordered — cannot move
  topLocked: ["Gross Scheduled Rent"],

  // The “divider” that separates above/below behavior
  divider: "Net Rental Income",

  // Default “above divider” order
  above: [
    "Vacancy/Collections Loss",
    "Less - Free Rent and/or Allowances",
    "Less - Other Adjustments",
  ],

  // Default “below divider” order
  below: ["Recoverable Income", "Other Income"],
};
