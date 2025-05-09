import React, { createContext, useContext, useState } from "react";

// Create a context for the game state
const AppContext = createContext();

// Provider component to provide game state to its children
export const AppProvider = ({ children }) => {
  const [base, setBase] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [showFilePanel, setShowFilePanel] = useState(false);

  return (
    <AppContext.Provider
      value={{
        base,
        setBase,
        selectedPropertyId,
        setSelectedPropertyId,
        showFilePanel,
        setShowFilePanel
        
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
