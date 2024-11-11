import React, { createContext, useContext, useState } from "react";

// Create a context for the game state
const TableContext = createContext();

// Provider component to provide game state to its children
export const TableProvider = ({ children }) => {
  const [rows, setRows] = useState([]);
  const [addingRow, setAddingRow] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);


  return (
    <TableContext.Provider
      value={{
        rows,
        setRows,
        addingRow,
        setAddingRow,
        selectedRow,
        setSelectedRow
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTable = () => useContext(TableContext);