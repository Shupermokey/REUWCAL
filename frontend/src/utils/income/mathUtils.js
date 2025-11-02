export const isNum = (v) => v !== "" && v != null && Number.isFinite(+v);
export const toMonthly = (n) => (isNum(n) ? +n / 12 : 0);
export const toAnnual = (n) => (isNum(n) ? +n * 12 : 0);
