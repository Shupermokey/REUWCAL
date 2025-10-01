import { useEffect, useState } from "react";
import { useTable } from "../../app/TableProvider";
import Row from "./Row";
import { useAuth } from "../../app/AuthProvider";
import FileExplorer from "../../components/Sidebar/FileSystem/FileExplorer";
import PropertyFileSidebar from "../../components/Sidebar/PropertyFileSidebar";
import { subscribeToBaselines } from "../../services/firestoreService";

import {
  addProperty,
  updateProperty,
  deleteProperty,
  initializeFileSystem,
  subscribeToProperties,
} from "../../services/firestoreService";
import columnConfig, { columnOrder } from "../../columnConfig";
import { makeBlankRow } from "../../utils/rows/rowSchema";
import { normalizeForSave } from "../../utils/rows/rowNormalize";

function Table({ onRowSelect }) {
  const { rows, setRows, selectedRow, setSelectedRow } = useTable();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [baselines, setBaselines] = useState([]);
  const [savingNew, setSavingNew] = useState(false); //Removes flicker of 2 rows
  const hasDraft = rows?.some((r) => r.id === "new");


  // 🔹 Load Baselines
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToBaselines(user.uid, (data) => {
      setBaselines(data);
    });
    return () => unsub();
  }, [user]);

  // 🔹 Load Properties
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProperties(user.uid, (data) => {
      setRows((prev) => {
        const draft = prev.find((r) => r.id === "new");
        if (!draft) return data;
        return draft ? [...data, draft] : data;
      });
    });
    return () => unsubscribe();
  }, [user, setRows]);

  const createBlankRow = () => makeBlankRow();

  const handleAddRow = () => {
    if (rows.some((row) => row.id === "new")) return; //Prevents multiple 'new' rows being created
    setRows((prev) => [...prev, createBlankRow()]);
    setSelectedRow("new");
  };

  const handleSaveRow = async (rowData) => {
    const isNew = rowData.id === "new";
    console.debug("Saving rowData from Row:", rowData); // should show your typed values
    if (!user) return;
    try {
      setIsSaving(true);
      const sanitizedData = normalizeForSave(rowData);
      if (rowData.id === "new") {
        if (isNew) setSavingNew(true);
        const { id, ...rowWithoutId } = sanitizedData;
        const newId = await addProperty(user.uid, rowWithoutId);
        await initializeFileSystem(user.uid, newId, columnOrder);
        setRows((prev) => prev.filter((r) => r.id !== "new"));
      } else {
        await updateProperty(user.uid, rowData.id, sanitizedData);
      }
      setSelectedRow(null);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
      setIsSaving(false);
    }
  };

  const handleCancelRow = () => {
    setRows((prev) => prev.filter((row) => row.id !== "new"));
    setIsSaving(false);
  };

  const handleDeleteRow = async (id) => {
    if (id === "new") {
      setRows((prev) => prev.filter((row) => row.id !== "new"));
    } else {
      await deleteProperty(user.uid, id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    }
  };

  return (
    <div className="table">
      {/* Table Headers */}
      <div className="row table-header">
        {columnOrder.map((key) => (
          <div
            key={key}
            className="cell"
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

      {/* Table Rows */}
      {rows.map((row) => (
        <Row
          key={row.id}
          row={row}
          baselines={baselines} // 🔹 Pass baselines down
          handleCellChange={(id, field, value) => {
            setRows((prevRows) =>
              prevRows.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
              )
            );
          }}
          isSelected={row.id === selectedRow}
          onSave={handleSaveRow}
          onCancel={handleCancelRow}
          onDelete={handleDeleteRow}
          onSelect={() => {
            setSelectedRow(row.id);
            if (onRowSelect) onRowSelect(row);
          }}
          onOpenFiles={(propertyId) => {
            setActiveSidebar(propertyId);
          }}
        />
      ))}


      {
        
        <div className="table-actions">
          <button
            onClick={handleAddRow}
            disabled={isSaving || hasDraft}
            title={hasDraft ? "Save or cancel the current row first" : ""}
          >
            + Add Row
          </button>
        </div>
      }

      {activeFolder && (
        <div className="file-explorer-sidebar">
          <FileExplorer propertyId={activeFolder} folderPath={[]} />
        </div>
      )}

      <PropertyFileSidebar
        isOpen={!!activeSidebar}
        propertyId={activeSidebar}
        onClose={() => setActiveSidebar(null)}
      />
    </div>
  );
}

export default Table;
