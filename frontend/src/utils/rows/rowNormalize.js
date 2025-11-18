// utils/rowNormalize.js
import columnConfig, { columnOrder } from "../../constants/columnConfig";

const unwrap = (v) =>
  v && typeof v === "object" && "value" in v ? v.value : v;

export const normalizeForSave = (row, isNewRow = false) => {
  const out = {};
  for (const key of columnOrder) {
    const cfg = columnConfig[key] || {};
    const rawValue = row[key];
    let v = unwrap(rawValue);

    if (cfg.forceNegative && typeof v === "number") {
      v = -Math.abs(v);
    }

    if (v === undefined || v === null || v === "") {
      v = cfg.type === "number" ? 0 : "";
    }
    if (cfg.type === "number" && typeof v === "string") {
      const n = Number(v.replace(/,/g, ""));
      v = Number.isFinite(n) ? n : 0;
    }

    // For custom fields (units, incomeStatement) on new rows, preserve object structure with hasInitialValue flag
    if (isNewRow && cfg.input === "custom" && v !== "" && v !== 0) {
      out[key] = {
        value: v,
        hasInitialValue: true
      };
    } else if (typeof rawValue === "object" && rawValue !== null && "hasInitialValue" in rawValue) {
      // Preserve existing hasInitialValue flag
      out[key] = {
        value: v,
        hasInitialValue: rawValue.hasInitialValue
      };
    } else {
      out[key] = v;
    }
  }
  return out;
};
