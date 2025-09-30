// src/utils/rows/rowValidation.js
import { unwrapValue } from "./rowHelpers";

export const validateFields = (editableRow, columnOrder, columnConfig) => {
  const invalids = columnOrder.filter((key) => {
    const expected = columnConfig[key]?.type; // "number" | "string" | etc.
    const value = unwrapValue(editableRow[key]);

    if (expected === "number") {
      // allow empty when optional; flag NaN when provided
      if (value === "" || value === null || value === undefined) return false;
      return Number.isNaN(Number(value));
    }
    if (expected === "string") {
      return typeof value !== "string";
    }
    return false;
  });

  return { ok: invalids.length === 0, invalids };
};
