// src/utils/rowHelpers.js
export const normalizeRow = (raw) => {
  const wrapped = {};
  for (const [key, val] of Object.entries(raw)) {
    if (key === "id" || key === "baselineSnapshot") {
      wrapped[key] = val;
      continue;
    }
    if (val !== null && typeof val === "object") {
      wrapped[key] = val; 
    } else {
      wrapped[key] = { value: val }; 
    }
  }
  return wrapped;
};

export const unwrapValue = (v) => {
  let x = v;
  while (x && typeof x === "object" && "value" in x) x = x.value;
  return x;
};

export const displayValue = (cell) => {
  const v = unwrapValue(cell);
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v;
};
