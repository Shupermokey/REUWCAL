import React, { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

export function IncomeViewProvider({ children }) {
  const [viewMode, setViewMode] = useState("annual"); // 'annual' | 'monthly'
  const [groupedView, setGroupedView] = useState(true);
  return (
    <Ctx.Provider value={{ viewMode, setViewMode, groupedView, setGroupedView }}>
      {children}
    </Ctx.Provider>
  );
}

export const useIncomeView = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIncomeView must be used within IncomeViewProvider");
  return ctx;
};
