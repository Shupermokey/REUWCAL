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

function Table({ onRowSelect }) {
  const { rows, setRows, selectedRow, setSelectedRow } = useTable();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [baselines, setBaselines] = useState([]);

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
      setRows(data.length > 0 ? data : [createBlankRow()]);
    });
    return () => unsubscribe();
  }, [user, setRows]);

  const createBlankRow = () => ({
    id: "new",
    propertyAddress: "",
    propertyTaxes: "",
    propertyGSA: "",
    propertyGBA: "",
    purchasePrice: "",
    Category: "",
  });

  const handleAddRow = () => {
    if (rows.some((row) => row.id === "new")) return;
    setIsSaving(true);
    setRows((prev) => [...prev, createBlankRow()]);
    setSelectedRow("new");
  };

  const handleSaveRow = async (rowData) => {
    if (!user) return;

    const unwrap = (v) => {
      let x = v;
      while (x && typeof x === "object" && "value" in x) x = x.value;
      return x ?? "";
    };

    const sanitizedData = Object.fromEntries(
      Object.entries(rowData).map(([key, value]) => {
        if (value && typeof value === "object" && !("value" in value)) {
          return [key, value];
        }
        return [key, unwrap(value)];
      })
    );

    if (rowData.id === "new") {
      const { id, ...rowWithoutId } = sanitizedData;
      const newId = await addProperty(user.uid, rowWithoutId);
      await initializeFileSystem(user.uid, newId, columnOrder);

      setRows((prev) =>
        prev.map((row) => (row.id === "new" ? { ...row, id: newId } : row))
      );
    } else {
      await updateProperty(user.uid, rowData.id, sanitizedData);
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowData.id ? { ...row, ...sanitizedData } : row
        )
      );
    }

    setIsSaving(false);
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
          onSave={() => handleSaveRow(row)}
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

      {/* Add Row Button */}
      {!rows.some((row) => row.id === "new") && (
        <button onClick={handleAddRow} className="add-row-btn">
          +
        </button>
      )}

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
