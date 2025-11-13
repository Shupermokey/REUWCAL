import React, { createContext, useContext, useState } from "react";


const AppContext = createContext();


export const AppProvider = ({ children }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <AppContext.Provider
      value={{
        showSidebar,
        setShowSidebar,
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
