import { useEffect, useState } from "react";
import { useTable } from "../../app/TableProvider";
import Row from "./Row";
import { useAuth } from "../../app/AuthProvider";
import FileExplorer from "../../components/Sidebar/FileSystem/FileExplorer";
import PropertyFileSidebar from "../../components/Sidebar/PropertyFileSidebar";

import {
  getProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  initializeFileSystem,
  subscribeToProperties,
} from "../../services/firestoreService";
import columnConfig, { columnOrder, columnWidths } from "../../columnConfig";

function Table({ onRowSelect }) {
  const { rows, setRows, selectedRow, setSelectedRow } = useTable();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProperties(user.uid, (data) => {
      setRows(data.length > 0 ? data : [createBlankRow()]);
    });
    return () => unsubscribe(); // 🔥 auto cleanup
  }, [user, setRows]);

  // // Function to create a blank row
  // const createBlankRow = () => ({
  //   id: "new",
  //   propertyAddress: "",
  //   purchasePriceSF: "",
  //   purchasePrice: "",
  //   ACQCAPXSF: "",
  //   ACQCAPX: "",
  //   UnitCount: "",
  //   GrossBuildingArea: "",
  //   GrossSiteArea: "",
  //   REPropertyTax: "",
  //   MarketRate: "",
  //   ServiceStructure: "",
  //   PropertyClass: "",
  //   Category: "",
  // });

  // Function to create a blank row
  const createBlankRow = () => ({
    id: "new",
    propertyAddress: "",
    propertyTaxes: "",
    propertyGSA: "",
    propertyGBA: "",
    purchasePrice: "",
    Category: "",
  });

  // Prevent multiple new rows until saved
  const handleAddRow = () => {
    if (rows.some((row) => row.id === "new")) return; // ✅ Prevent multiple unsaved rows

    setIsSaving(true);
    setRows((prevRows) => [
      ...prevRows,
      {
        // id: "new",
        // propertyAddress: "",
        // purchasePriceSF: "",
        // purchasePrice: "",
        // ACQCAPXSF: "",
        // ACQCAPX: "",
        // UnitCount: "",
        // GrossBuildingArea: "",
        // GrossSiteArea: "",
        // REPropertyTax: "",
        // MarketRate: "",
        // ServiceStructure: "",
        // PropertyClass: "",
        // Category: "",
        // ScenarioRows: [],
        id: "new",
        propertyAddress: "",
        propertyTaxes: "",
        propertyGSA: "",
        propertyGBA: "",
        purchasePrice: "",
        Category: "",
      },
    ]);

    setSelectedRow("new");
  };

  const handleSaveRow = async (rowData) => {
    if (!user) return;

    const sanitizedData = Object.fromEntries(
      Object.entries(rowData).map(([key, value]) => [key, value || ""])
    );

    if (rowData.id === "new") {
      const { id, ...rowWithoutId } = sanitizedData;
      const newId = await addProperty(user.uid, rowWithoutId);

      await initializeFileSystem(user.uid, newId, columnOrder);

      setRows((prevRows) =>
        prevRows.map((row) => (row.id === "new" ? { ...row, id: newId } : row))
      );
    } else {
      await updateProperty(user.uid, rowData.id, sanitizedData);

      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowData.id ? { ...row, ...sanitizedData } : row
        )
      );
    }

    setIsSaving(false);
  };

  const handleCancelRow = () => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== "new")); // ✅ Remove only the "new" row
    setIsSaving(false); // ✅ Reset isSaving so "+ Add Row" button reappears
  };

  const handleDeleteRow = async (id) => {
    if (id === "new") {
      setRows((prevRows) => prevRows.filter((row) => row.id !== "new"));
    } else {
      await deleteProperty(user.uid, id);
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    }
  };

  return (
    <div className="table">
      {/* Table Headers */}
      {/* <div className="row">
        {[
          // "Property Address",
          // "Purchase Price ($/SF)",
          // "Purchase Price",
          // "ACQ CAPx ($/SF)",
          // "ACQ CAPx ($)",
          // "Unit Count",
          // "Gross Building Area",
          // "Gross Site Area (Acres)",
          // "RE Property Tax",
          // "Market Rate",
          // "Service Structure",
          // "Property Class",
          "propertyAddress", //NEW
          "propertyTaxes",   //NEW
          "propertyGSA",     //NEW
          "propertyGBA",     //NEW
          "purchasePrice",   //NEW
          "Category",
          "EditingTools",
        ].map((header, index) => (
          <div key={index} className="table-header">
            {header}
          </div>
        ))}
      </div> */}
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
          <FileExplorer
            propertyId={activeFolder}
            folderPath={[]} // root level
          />
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
