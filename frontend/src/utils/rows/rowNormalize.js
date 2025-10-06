// utils/rowNormalize.js
import columnConfig, { columnOrder } from "../../columnConfig";

const unwrap = (v) =>
  v && typeof v === "object" && "value" in v ? v.value : v;

export const normalizeForSave = (row) => {
  const out = {};
  for (const key of columnOrder) {
    const cfg = columnConfig[key] || {};
    let v = unwrap(row[key]);
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
    out[key] = v;
  }
  return out;
};
