import React, { createContext, useContext, useState } from "react";

// Create a context for the game state
const AppContext = createContext();

// Provider component to provide game state to its children
export const AppProvider = ({ children }) => {
    const [base, setBase] = useState(false);


  return (
    <AppContext.Provider
      value={{
        base,
        setBase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);