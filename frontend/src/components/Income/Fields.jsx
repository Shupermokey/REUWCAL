import React from "react";

export function Field({ label, value, onChange }) {
  return (
    <label className="col-field">
      <span className="col-label">{label}</span>
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => {
          // Allow temporary blanks while editing; treat "" as NaN
          const v = e.target.value;
          onChange(v === "" ? NaN : parseFloat(v));
        }}
        inputMode="decimal"
        step="any"
      />
    </label>
  );
}

export function ReadOnly({ label, value }) {
  return (
    <label className="col-field readonly">
      <span className="col-label">{label}</span>
      <input type="number" value={Number(value || 0)} readOnly />
    </label>
  );
}
