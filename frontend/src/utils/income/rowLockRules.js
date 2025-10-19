// utils/income/rowLockRules.js
export const ROW_LOCK_RULES = {
  "Gross Scheduled Rent": { pinned: true, locked: true, noSub: true, noDelete: true },
  "Net Rental Income": { noDelete: true, noSub: true },
};
