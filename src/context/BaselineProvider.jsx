import React, { createContext, useContext, useState } from "react";

// Create a context for the game state
const BaselineContext = createContext();

// Provider component to provide game state to its children
export const BaselineProvider = ({ children }) => {
    const [baseline, setBaseline] = useState({});


  return (
    <BaselineContext.Provider
      value={{
        base,
        setBase
      }}
    >
      {children}
    </BaselineContext.Provider>
  );
};

export const useApp = () => useContext(BaselineContext);