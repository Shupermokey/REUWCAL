import React from "react";
export default function TotalsBar({ label, value }) {
  return (
    <div className="subtotal-row">
      <strong>{label}:</strong>
      <span>${Number(value || 0).toLocaleString()}</span>
    </div>
  );
}
