// utils/income/sortSection.js
import { INCOME_STRUCTURE } from "@/constants/incomeOrder.js";

export function sortIncomeSection(data, userOrder = null) {
  if (!data || typeof data !== "object") return data;

  const { topLocked, divider, above, below } = INCOME_STRUCTURE;
  const keys = Object.keys(data);

  // 1️⃣ Locked top
  const top = topLocked.filter((k) => keys.includes(k));

  // 2️⃣ Divider (always one)
  const hasDivider = keys.includes(divider) ? [divider] : [];

  // 3️⃣ Above + custom
  const aboveItems = above.filter((k) => keys.includes(k));
  const customAbove = keys.filter(
    (k) =>
      ![...top, divider, ...above, ...below].includes(k) &&
      keys.indexOf(k) < keys.indexOf(divider)
  );

  // 4️⃣ Below + custom
  const belowItems = below.filter((k) => keys.includes(k));
  const customBelow = keys.filter(
    (k) =>
      ![...top, divider, ...above, ...below].includes(k) &&
      keys.indexOf(k) > keys.indexOf(divider)
  );

  // 5️⃣ Merge in order
  const orderedKeys = [
    ...top,
    ...aboveItems,
    ...customAbove,
    ...hasDivider,
    ...belowItems,
    ...customBelow,
  ];

  // 6️⃣ Build sorted object
  const sorted = {};
  orderedKeys.forEach((k) => {
    if (data[k]) sorted[k] = data[k];
  });

  return sorted;
}
