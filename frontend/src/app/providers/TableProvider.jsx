import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthProvider";

// Create a context for the game state
const TableContext = createContext();

// Provider component to provide game state to its children
export const TableProvider = ({ children }) => {
  
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [unleveredRow, setUnleveredRow] = useState([]);
  const [leveredRow, setLeveredRow] = useState([]);
  const [addingRow, setAddingRow] = useState(false);
  const [selectedRow, setSelectedRow] = useState(-1);
 
 const updateRowCell = useCallback((rowId, key, value) => {
  setRows(prev =>
    prev.map(r => (r.id === rowId ? { ...r, [key]: value } : r))
  );
}, []);

  /* ---------------------------------------------
   *  Save a full row back to Firestore
   * --------------------------------------------- */
  const saveRowToFirestore = useCallback(
    async (propertyId) => {
      if (!user) return;
      const row = rows.find(r => r.id === propertyId);
      if (!row) return;

      // unwrap { value } cells → plain object
      const flatData = Object.fromEntries(
        Object.entries(row).map(([k, v]) =>
          v && typeof v === "object" && "value" in v ? [k, v.value] : [k, v]
        )
      );

      await saveRowData(user.uid, propertyId, flatData);
      console.log("✅ Row saved to Firestore:", propertyId, flatData);
    },
    [rows, user]
  );


  return (
    <TableContext.Provider
      value={{
        rows,
        setRows,
        unleveredRow,
        setUnleveredRow,
        leveredRow,
        setLeveredRow,
        addingRow,
        setAddingRow,
        selectedRow,
        setSelectedRow,
        updateRowCell,
        saveRowToFirestore
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTable = () => useContext(TableContext);