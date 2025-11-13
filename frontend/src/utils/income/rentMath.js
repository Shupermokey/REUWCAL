// Which fields exist and what they depend on
export const RENT_KEYS = {
  rate: "rate",                     // $/SF/Year (displayed smaller)
  gross: "grossRentalIncome",       // $
  psf: "psf",                       // $/SF
  punit: "punit",                   // $/Unit
  gba: "propertyGBA",               // SF (already in your row)
  units: "units"                    // count (already in your row)
};

// Forward/inverse formulas.
// We keep everything pure and **no eval**.
export const RentFormulas = {
  // Forward directions
  grossFromPsf: ({ psf, gba }) => (num(psf) * num(gba)),
  grossFromPunit: ({ punit, units }) => (num(punit) * num(units)),
  psfFromGross: ({ gross, gba }) => (num(gross) / safe(num(gba))),
  punitFromGross: ({ gross, units }) => (num(gross) / safe(num(units))),

  // Optional: treat "rate" as an alias to psf (common in CRE)
  rateFromPsf: ({ psf }) => num(psf),
  psfFromRate: ({ rate }) => num(rate),
};

export function recalcMetrics(val, { GBA, UNITS }) {
  if (!val || !GBA || !UNITS) return val;
  const next = { ...val };
  const g = next.grossMonthly ?? 0;
  if (g) {
    next.psfMonthly = Number((g / GBA).toFixed(4));
    next.punitMonthly = Number((g / UNITS).toFixed(4));
    next.grossAnnual = g * 12;
    next.psfAnnual = next.psfMonthly * 12;
    next.punitAnnual = next.punitMonthly * 12;
  }
  return next;
}


const num = (x) => (typeof x === "number" ? x : parseFloat(x ?? "") || 0);
const safe = (d) => (d === 0 ? 1 : d);
