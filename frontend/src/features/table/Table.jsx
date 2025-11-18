import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { useTable } from "../../app/providers/TableProvider";
import Row from "./Row/Row";
import { useAuth } from "../../app/providers/AuthProvider";
import { subscribeToBaselines } from "../../services/firestoreService";
import {
  addProperty,
  updateProperty,
  deleteProperty,
  initializeFileSystem,
  subscribeToProperties,
} from "../../services/firestoreService";
import { autoGenerateUnits } from "../../services/unitSyncService";
import { getIncomeStatement, saveIncomeStatement } from "../../services/firestore/incomeStatementService";
import columnConfig, { columnOrder } from "../../constants/columnConfig";
import { makeBlankRow } from "../../utils/rows/rowSchema";
import { normalizeForSave } from "../../utils/rows/rowNormalize";

// ✅ Scoped styles
import "@/styles/components/Table/Table.css";

function Table({ onRowSelect }) {
  const { user } = useAuth();
  const { rows, setRows, selectedRow, setSelectedRow } = useTable();
  const [isSaving, setIsSaving] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [baselines, setBaselines] = useState([]);
  const [savingNew, setSavingNew] = useState(false);

  // ✅ Memoize to prevent recalculation on every render
  const hasDraft = useMemo(() => rows?.some((r) => r.id === "new"), [rows]);

  /* ---------------------------- Load Baselines ---------------------------- */
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToBaselines(user.uid, (data) => setBaselines(data));
    return () => unsub();
  }, [user]);

  /* ---------------------------- Load Properties --------------------------- */
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProperties(user.uid, (data) => {
      setRows((prev) => {
        const draft = prev.find((r) => r.id === "new");
        return draft ? [...data, draft] : data;
      });
    });
    return () => unsubscribe();
  }, [user, setRows]);

  /* ------------------------------ CRUD Actions ---------------------------- */
  const createBlankRow = () => makeBlankRow();

  const handleAddRow = useCallback(() => {
    if (rows.some((row) => row.id === "new")) return;
    setRows((prev) => [...prev, createBlankRow()]);
    setSelectedRow("new");
  }, [rows, setRows, setSelectedRow]);

  const handleSaveRow = useCallback(
    async (rowData) => {
      const isNew = rowData.id === "new";
      if (!user) return;

      try {
        setIsSaving(true);
        const sanitizedData = normalizeForSave(rowData, isNew);

        if (isNew) {
          console.log("Adding new property:", sanitizedData);
          setSavingNew(true);
          const { id, ...dataWithoutId } = sanitizedData;
          const newId = await addProperty(user.uid, dataWithoutId);
          setRows((prev) => prev.filter((r) => r.id !== "new"));

          // Initialize core property structures ONLY for new properties
          try {
            console.log('Initializing property structures for new property:', newId);

            // Helper to unwrap values
            const unwrapValue = (cell) => {
              const v = typeof cell === "object" ? cell.value : cell;
              const n = Number(v);
              return Number.isFinite(n) ? n : 0;
            };

            const totalUnits = unwrapValue(sanitizedData.units);
            const initialIncomeValue = unwrapValue(sanitizedData.incomeStatement);
            const gba = unwrapValue(sanitizedData.grossBuildingArea);

            // Initialize Income Statement
            let incomeData = await getIncomeStatement(user.uid, newId);

            // If initial income value provided, set it on GSR
            if (initialIncomeValue > 0 && incomeData.Income?.items?.gsr) {
              incomeData.Income.items.gsr.grossAnnual = initialIncomeValue;
              incomeData.Income.items.gsr.grossMonthly = Math.round((initialIncomeValue / 12) * 100) / 100;
            }

            await saveIncomeStatement(user.uid, newId, incomeData);
            console.log('Income Statement initialized');

            // Initialize Units table
            const unitsRef = doc(db, 'users', user.uid, 'properties', newId, 'details', 'units');
            const defaultUnitsData = {
              unitMix: [],
              rentRoll: {
                totalMonthlyRent: 0,
                occupancyRate: 100
              }
            };
            await setDoc(unitsRef, defaultUnitsData);
            console.log('Units table initialized');

            // Auto-generate units if units > 0
            if (totalUnits > 0) {
              console.log(`Auto-generating ${totalUnits} units with GSR ${initialIncomeValue}`);

              const result = await autoGenerateUnits(user.uid, newId, totalUnits, initialIncomeValue, gba);

              if (result.tooMany) {
                toast.error(
                  `You're creating ${totalUnits} units! That's a lot. Please use the Units dropdown for better categorization.`,
                  { duration: 5000 }
                );
              } else if (result.success) {
                toast.success(
                  `Auto-generated ${totalUnits} units with avg rent $${result.avgRent}/mo and ${result.avgSqFt} sq ft`,
                  { duration: 4000 }
                );
              }
            }
          } catch (error) {
            console.error('Error initializing property structures:', error);
            toast.error(`Failed to initialize property: ${error.message}`);
          }
        } else {
          await updateProperty(user.uid, rowData.id, sanitizedData);
        }

        setSelectedRow(null);
      } catch (e) {
        console.error("Save failed", e);
      } finally {
        setIsSaving(false);
        setSavingNew(false);
      }
    },
    [user, setRows, setSelectedRow]
  );

  const handleCancelRow = useCallback(() => {
    setRows((prev) => prev.filter((row) => row.id !== "new"));
    setIsSaving(false);
  }, [setRows]);

  const handleDeleteRow = useCallback(
    async (id) => {
      if (id === "new") {
        setRows((prev) => prev.filter((row) => row.id !== "new"));
      } else {
        await deleteProperty(user.uid, id);
        setRows((prev) => prev.filter((row) => row.id !== id));
      }
    },
    [user, setRows]
  );

  /* ------------------------------ Cell Actions ---------------------------- */
  const handleCellChange = useCallback(
    (id, field, value) => {
      setRows((prevRows) =>
        prevRows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    },
    [setRows]
  );

  const handleSelectRow = useCallback(
    (row) => {
      setSelectedRow(row.id);
      if (onRowSelect) onRowSelect(row);
    },
    [setSelectedRow, onRowSelect]
  );

  /* ------------------------------- Render --------------------------------- */
  return (
    <div className="table">
      {/* Header */}
      <div className="table__header">
        {columnOrder.map((key) => (
          <div
            key={key}
            className="table__cell table__cell--header"
            style={{
              width: columnConfig[key].width,
              minWidth: columnConfig[key].width,
              maxWidth: columnConfig[key].width,
            }}
          >
            {columnConfig[key]?.label || key}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="table__body">
        {rows.length > 0 ? (
          rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              baselines={baselines}
              handleCellChange={handleCellChange}
              isSelected={row.id === selectedRow}
              onSave={handleSaveRow}
              onCancel={handleCancelRow}
              onDelete={handleDeleteRow}
              onSelect={() => handleSelectRow(row)}
              onOpenFiles={setActiveSidebar}
            />
          ))
        ) : (
          <div className="table__empty">
            No properties yet.
            <button onClick={handleAddRow}>Add your first one</button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="table__footer">
        <button
          onClick={handleAddRow}
          disabled={isSaving || hasDraft}
          title={hasDraft ? "Save or cancel the current row first" : ""}
          className="table__add-btn"
        >
          + Add Row
        </button>
      </div>

      {/* File System */}
      {activeFolder && (
        <div className="table__file-explorer">
          <FileExplorer propertyId={activeFolder} folderPath={[]} />
        </div>
      )}

    </div>
  );
}

export default Table;
