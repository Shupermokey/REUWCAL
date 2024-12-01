import React, { createContext, useContext, useState } from "react";

// Create a context for the game state
const ScenarioContext = createContext();

// Provider component to provide game state to its children
export const ScenarioProvider = ({ children }) => {
    const [srows, setSrows] = useState([]);
    const [createScenario, setCreateScenario] = useState(false);


  return (
    <ScenarioContext.Provider
      value={{
        srows,
        setSrows,
        createScenario,
        setCreateScenario
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => useContext(ScenarioContext);