import { useEffect, useState } from "react";
import { useTable } from "../context/TableProvider";
import Row from "./Row";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthProvider";
import FileExplorer from "./Sidebar/FileSystem/FileExplorer";
import PropertyFileSidebar from "./Sidebar/PropertyFileSidebar";
import Sidebar from "./Sidebar";
import {columnOrder} from './Row'

function Table({ onRowSelect }) {
  const { rows, setRows, selectedRow, setSelectedRow } = useTable();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeFileSidebar, setActiveFileSidebar] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  

  useEffect(() => {
    if (!user) return;
    const fetchRows = async () => {
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "properties"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRows(data.length > 0 ? data : [createBlankRow()]);
    };
    fetchRows();
  }, [user, setRows]);

  // Function to create a blank row
  const createBlankRow = () => ({
    id: "new",
    propertyAddress: "",
    purchasePriceSF: "",
    purchasePrice: "",
    ACQCAPXSF: "",
    ACQCAPX: "",
    UnitCount: "",
    GrossBuildingArea: "",
    GrossSiteArea: "",
    REPropertyTax: "",
    MarketRate: "",
    ServiceStructure: "",
    PropertyClass: "",
    Category: "", // Dropdown with Base1 - Base4
    ScenarioRows: []
  });

  // Prevent multiple new rows until saved
  const handleAddRow = () => {
    if (rows.some(row => row.id === "new")) return; // ✅ Prevent multiple unsaved rows
  
    setIsSaving(true);
    setRows(prevRows => [
      ...prevRows,
      {
        id: "new",
        propertyAddress: "",
        purchasePriceSF: "",
        purchasePrice: "",
        ACQCAPXSF: "",
        ACQCAPX: "",
        UnitCount: "",
        GrossBuildingArea: "",
        GrossSiteArea: "",
        REPropertyTax: "",
        MarketRate: "",
        ServiceStructure: "",
        PropertyClass: "",
        Category: "",
        ScenarioRows: []
      }
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
      const docRef = await addDoc(collection(db, "users", user.uid, "properties"), rowWithoutId);
  
      const fileSystemBasePath = collection(
        db,
        "users",
        user.uid,
        "properties",
        docRef.id,
        "fileSystem"
      );
  
      await setDoc(
        doc(fileSystemBasePath, "README"),
        {
          note: "This is the file system for this property",
          createdAt: new Date(),
        },
        { merge: true } // ✅ avoids overwriting if README exists
      );

      await Promise.all(
        columnOrder.map(async (header) => {
          await setDoc(doc(fileSystemBasePath, header), {
            type: "folder",
            title: header,
            createdAt: new Date(),
          });
        }))      

  
      setRows(prevRows =>
        prevRows.map(row => row.id === "new" ? { ...row, id: docRef.id } : row)
      );
    } else {
      const rowRef = doc(db, "users", user.uid, "properties", rowData.id);
      await updateDoc(rowRef, sanitizedData);
  
      setRows(prevRows =>
        prevRows.map(row =>
          row.id === rowData.id ? { ...row, ...sanitizedData } : row
        )
      );
    }
  
    setIsSaving(false);
  };
  
  
  
  
  const handleCancelRow = () => {
    setRows(prevRows => prevRows.filter(row => row.id !== "new")); // ✅ Remove only the "new" row
    setIsSaving(false); // ✅ Reset isSaving so "+ Add Row" button reappears
  };
  

  const handleDeleteRow = async (id) => {
    if (id === "new") {
      // If it's a new row, just remove it from the UI
      setRows(prevRows => prevRows.filter(row => row.id !== "new"));
    } else {
      // Delete from Firestore
      await deleteDoc(doc(db, "users", user.uid, "properties", id));
      setRows(prevRows => prevRows.filter(row => row.id !== id));
    }
  };
  

  return (
    <div className="table">
      {/* Table Headers */}
      <div className="row">
        {[
          "Property Address", "Purchase Price ($/SF)", "Purchase Price", "ACQ CAPx ($/SF)", 
          "ACQ CAPx ($)", "Unit Count", "Gross Building Area", "Gross Site Area (Acres)",
          "RE Property Tax", "Market Rate", "Service Structure", "Property Class", "Category", "EditingTools"
        ].map((header, index) => (
          <div key={index} className="table-header">{header}</div>
        ))}
      </div>

      {/* Table Rows */}
      {rows.map(row => (
       <Row
       key={row.id}
       row={row}
       handleCellChange={(id, field, value) => {
         setRows(prevRows =>
           prevRows.map(row => row.id === id ? { ...row, [field]: value } : row)
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
      {!rows.some(row => row.id === "new") && (
  <button onClick={handleAddRow} className="add-row-btn">+</button>
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


      {/* Property Dashboard */}
      {/* {selectedRow && <PropertyDashboard id={selectedRow} />} */}
    </div>
    
  );
}

export default Table;
