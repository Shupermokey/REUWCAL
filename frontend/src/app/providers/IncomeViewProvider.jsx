import React, { createContext, useContext, useState, useMemo } from "react";

const IncomeViewCtx = createContext(null);

export function IncomeViewProvider({ children }) {
  // 'monthly' | 'annual' | 'both'
  const [displayMode, setDisplayMode] = useState('annual');

  // Rate decimal places: 0-4
  const [rateDecimalPlaces, setRateDecimalPlaces] = useState(2);

  const value = useMemo(() => ({
    displayMode,
    setDisplayMode,
    rateDecimalPlaces,
    setRateDecimalPlaces,
  }), [displayMode, rateDecimalPlaces]);

  return <IncomeViewCtx.Provider value={value}>{children}</IncomeViewCtx.Provider>;
}

export function useIncomeView() {
  const ctx = useContext(IncomeViewCtx);
  if (!ctx) throw new Error("useIncomeView must be used inside IncomeViewProvider");
  return ctx;
}
