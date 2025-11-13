// src/utils/rows/rowValidation.js
import { unwrapValue } from "./rowHelpers";

export const validateFields = (editableRow, columnOrder, columnConfig) => {
  const invalids = columnOrder.filter((key) => {
    const config = columnConfig[key];
    const expected = config?.type; // "number" | "string" | etc.
    const value = unwrapValue(editableRow[key]);

    // Skip validation for controls (Editing Tools)
    if (expected === "controls") {
      return false;
    }

    // All fields are now required - check for empty values
    if (value === "" || value === null || value === undefined) {
      return true; // Field is invalid because it's empty
    }

    // Type-specific validation
    if (expected === "number") {
      return Number.isNaN(Number(value));
    }
    if (expected === "string") {
      // String must be non-empty and not just whitespace
      return typeof value !== "string" || value.trim() === "";
    }

    return false;
  });

  return { ok: invalids.length === 0, invalids };
};
