// utils/rowSchema.js
import columnConfig, { columnOrder } from "../../constants/columnConfig";

// Optional: encode defaults per column; fallback to type-based defaults
//Iterate through column order and determine default value for each key. 0, "", or undefined
const defaultFor = (key) => {
  const cfg = columnConfig[key] || {};
  if (cfg.default !== undefined) return cfg.default;
  if (cfg.type === "number") return 0;
  return ""; // string/unknown
};

// Generate a blank row object with all columns set to their default values
export const makeBlankRow = () => {
  const base = Object.fromEntries(columnOrder.map((k) => [k, defaultFor(k)]));
  return { id: "new", ...base };
};

// Example output of makeBlankRow():
// base = {
//   propertyAddress: "",
//   ... etc for all columns
//   EditingTools: ""
// };

// return
// {
//   id: "new",
//   propertyAddress: "",
//   ... etc for all columns
//   EditingTools: ""
// }

