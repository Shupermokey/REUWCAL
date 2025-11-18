// src/utils/rows/rowHelpers.js

/** Small utils */
export const isPlainObject = (v) =>
  v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

export const isWrappedCell = (v) => isPlainObject(v) && Object.prototype.hasOwnProperty.call(v, "value");

/** Wrap a primitive (or already-wrapped cell) into the uniform cell shape */
export const wrapCell = (v) => {
  if (isWrappedCell(v)) return v;           // { value, ... } -> keep as-is
  if (isPlainObject(v) && !("value" in v))  // folders / complex objects -> leave alone
    return v;
  return { value: v };                       // primitives -> wrap
};

/**
 * Normalize a row so every editable field is shaped like { value, ... }.
 * Leaves `id` and `baselineSnapshot` untouched.
 */
export const normalizeRow = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    if (key === "id" || key === "baselineSnapshot") {
      out[key] = val;
      continue;
    }
    out[key] = wrapCell(val);
  }
  return out;
};

/** Unwrap a cell down to its primitive value; tolerates nested {value: {value: ...}} chains */
export const unwrapValue = (v) => {
  let x = v;
  while (isWrappedCell(x)) x = x.value;
  return x;
};

/**
 * Human-friendly display of a cell value.
 * Options:
 *  - placeholder: string used for empty/null (default "—")
 *  - bool: { trueText, falseText } (default Yes/No)
 */
export const displayValue = (
  cell,
  opts = { placeholder: "—", bool: { trueText: "Yes", falseText: "No" } }
) => {
  const v = unwrapValue(cell);
  if (v === null || v === undefined || v === "") return opts.placeholder ?? "—";
  if (typeof v === "boolean") {
    const { trueText = "Yes", falseText = "No" } = opts.bool || {};
    return v ? trueText : falseText;
  }
  return v;
};

/**
 * Create a new cell based on a previous one, updating the value but preserving details.
 * Extra fields (like { details: {...}, source: 'IncomeStatement' }) can be merged in.
 */
export const updateCell = (prev, nextValue, extra = {}) => {
  const base = isWrappedCell(prev) ? prev : wrapCell(prev);
  const merged = {
    ...base,
    ...extra,
    value: nextValue,
  };
  // ensure details object remains an object if present on either side
  if (base?.details || extra?.details) {
    merged.details = { ...(base?.details || {}), ...(extra?.details || {}) };
  }
  return merged;
};

/**
 * Build a plain object of unwrapped values from a normalized row.
 * Useful for feeding read-only views, calculations, etc.
 */
export const toPlainValues = (normalizedRow) => {
  const out = {};
  for (const [k, v] of Object.entries(normalizedRow || {})) {
    out[k] = unwrapValue(v);
  }
  return out;
};

/**
 * Coerce numeric cells based on columnConfig before saving (optional).
 * If columnConfig[key].type === 'number' we coerce value -> Number or 0 if blank.
 * (You can also do this in your dedicated normalizeForSave if you prefer.)
 */
export const coerceByConfig = (normalizedRow, columnConfig = {}) => {
  const out = {};
  for (const [k, cell] of Object.entries(normalizedRow || {})) {
    if (k === "id" || k === "baselineSnapshot") {
      out[k] = cell;
      continue;
    }
    const cfg = columnConfig[k];
    if (cfg?.type === "number") {
      const v = unwrapValue(cell);
      const num = v === "" || v === null || v === undefined ? 0 : Number(v);
      out[k] = updateCell(cell, Number.isFinite(num) ? num : 0);
    } else {
      out[k] = isWrappedCell(cell) ? cell : wrapCell(cell);
    }
  }
  return out;
};

/** Shallow-merge helper for rows */
export const mergeRows = (a = {}, b = {}) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    // if both sides are cells, prefer right but keep details if missing
    if (isWrappedCell(a[k]) && isWrappedCell(v)) {
      out[k] = updateCell(a[k], v.value, { details: v.details });
    } else {
      out[k] = v;
    }
  }
  return out;
};
