// utils/rowSchema.js
import columnConfig, { columnOrder } from "../../columnConfig";

// Optional: encode defaults per column; fallback to type-based defaults
const defaultFor = (key) => {
  const cfg = columnConfig[key] || {};
  if (cfg.default !== undefined) return cfg.default;
  if (cfg.type === "number") return 0;
  return ""; // string/unknown
};

export const makeBlankRow = () => {
  const base = Object.fromEntries(columnOrder.map((k) => [k, defaultFor(k)]));
  return { id: "new", ...base };
};
