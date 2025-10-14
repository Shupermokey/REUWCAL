// src/utils/formatters.js
export const formatCurrency = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};
