import { useRef } from "react";
import { RENT_KEYS, RentFormulas } from "../utils/income/rentMath"

// Keeps reversible fields consistent. Call when any of the keys changes.
// Returns a patch object you can merge into editableRow.
export function useRowCalcs() {
  // lastEdited remembers which of the four was typed last
  const lastEditedRef = useRef(null); // "gross" | "psf" | "punit" | "rate"

  const setLastEdited = (k) => { lastEditedRef.current = k; };

  const recompute = (row) => {
    const { grossRentalIncome: gross, psf, punit, rate } = row;
    const gba = row[RENT_KEYS.gba];
    const units = row[RENT_KEYS.units];

    // snapshot to numbers
    const N = (v) => (typeof v === "object" ? v.value : v);
    const state = {
      gross: +N(gross) || 0,
      psf: +N(psf) || 0,
      punit: +N(punit) || 0,
      rate: +N(rate) || 0,
      gba: +N(gba) || 0,
      units: +N(units) || 0,
    };

    const out = {};

    // Respect the last edited field to avoid tug-of-war.
    const last = lastEditedRef.current;

    if (last === "gross") {
      out.psf  = RentFormulas.psfFromGross({ gross: state.gross, gba: state.gba });
      out.punit= RentFormulas.punitFromGross({ gross: state.gross, units: state.units });
      out.rate = RentFormulas.rateFromPsf({ psf: out.psf });
    } else if (last === "psf") {
      const gross2 = RentFormulas.grossFromPsf({ psf: state.psf, gba: state.gba });
      out.gross = gross2;
      out.punit = RentFormulas.punitFromGross({ gross: gross2, units: state.units });
      out.rate  = RentFormulas.rateFromPsf({ psf: state.psf });
    } else if (last === "punit") {
      const gross2 = RentFormulas.grossFromPunit({ punit: state.punit, units: state.units });
      out.gross = gross2;
      out.psf   = RentFormulas.psfFromGross({ gross: gross2, gba: state.gba });
      out.rate  = RentFormulas.rateFromPsf({ psf: out.psf });
    } else if (last === "rate") {
      const gross2 = RentFormulas.grossFromPsf({ psf: state.rate, gba: state.gba });
      out.gross = gross2;
      out.psf   = state.rate;
      out.punit = RentFormulas.punitFromGross({ gross: gross2, units: state.units });
    } else {
      // No “last edited” — do nothing
    }

    // Return patch with wrapped shape {value}
    const wrap = (v) => ({ ...(typeof v === "object" ? v : {}), value: v });
    const patch = {};
    if ("gross" in out)  patch[RENT_KEYS.gross] = wrap(round(out.gross));
    if ("psf" in out)    patch["psf"]           = wrap(round(out.psf));
    if ("punit" in out)  patch["punit"]         = wrap(round(out.punit));
    if ("rate" in out)   patch["rate"]          = wrap(round(out.rate));
    return patch;
  };

  return { setLastEdited, recompute };
}

const round = (v) => Math.round(v * 100) / 100; // 2 decimals; tweak as needed
