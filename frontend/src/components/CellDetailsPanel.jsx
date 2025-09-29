import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import FileExplorer from "./Sidebar/FileSystem/FileExplorer";
import "../styles/CellDetailsPanel.css";
import CustomBreakdownInputs from "./CustomBreakdownInputs";
import { breakdownConfig } from "../columnConfig";
import EmbeddedFolderExplorer from "./Sidebar/FileSystem/EmbeddedFolderExplorer";

const defaultCategories = ["Commercial", "Residential"];

const CellDetailsPanel = ({
  columnKey,
  data,
  onUpdate,
  propertyId,
  userId,
}) => {
  const [localData, setLocalData] = useState(data);
  const [folders, setFolders] = useState([]);
  const [showFileSidebar, setShowFileSidebar] = useState(null); // now stores the folder label
  const [customCategories, setCustomCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubtype, setNewSubtype] = useState("");
  const [activeCategoryDocId, setActiveCategoryDocId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [defaultSubtypes, setDefaultSubtypes] = useState({
    Commercial: [],
    Residential: [],
  });
  // 👇 Inside CellDetailsPanel.jsx
  const [folderStack, setFolderStack] = useState([]); // for navigation
  const [currentFolder, setCurrentFolder] = useState(null);

  const [openFolderLabel, setOpenFolderLabel] = useState(null);

  // This replaces the previous showFileSidebar logic
  const openFolder = (label) => {
    setFolderStack((prev) => [...prev, label]);
    setCurrentFolder(label);
  };

  const goBack = () => {
    setFolderStack((prev) => {
      const next = prev.slice(0, -1);
      setCurrentFolder(next[next.length - 1] || null);
      return next;
    });
  };

  const handleCustomInputChange = (updated) => {
    setLocalData((prev) => ({
      ...prev,
      customInputs: updated,
    }));
  };

  const structure = breakdownConfig[columnKey] || [];

  useEffect(() => {
    setLocalData((prev) => ({
      ...data,
      details: {
        ...(data.details || {}),
      },
    }));
  }, [data]);

  useEffect(() => {
    const loadZoningCategories = async () => {
      const snap = await getDocs(
        collection(db, "users", userId, "zoningCategories")
      );
      const custom = snap.docs.map((doc) => ({
        id: doc.id,
        label: doc.data().label,
        subtypes: doc.data().subtypes || [],
      }));
      setCustomCategories(custom);
    };
    loadZoningCategories();
  }, [userId]);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!userId || !propertyId || !columnKey) return;
      const folderRef = collection(
        db,
        "users",
        userId,
        "properties",
        propertyId,
        "fileSystem",
        columnKey,
        "folders"
      );
      const snapshot = await getDocs(folderRef);
      const folderList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFolders(folderList);
    };
    fetchFolders();
  }, [userId, propertyId, columnKey]);

  const handleChange = (label, value) => {
    setLocalData((prev) => {
      const updatedDetails = {
        ...prev.details,
        [label]: value,
      };
      if (label === "Zoning Category") {
        updatedDetails["Zoning Subtype"] = "";
      }
      return {
        ...prev,
        details: updatedDetails,
      };
    });
  };

  const handleSave = () => {
    const valueSum = Object.entries(localData.details || {})
      .filter(([_, val]) => typeof val === "number")
      .reduce((sum, [_, val]) => sum + parseFloat(val || 0), 0);
    const updated = {
      ...localData,
      value: valueSum,
    };
    onUpdate(updated);
  };

  const addNewCategory = async () => {
    const cleaned = newCategory.trim();
    if (!cleaned || defaultCategories.includes(cleaned)) return;
    const ref = await addDoc(
      collection(db, "users", userId, "zoningCategories"),
      {
        label: cleaned,
        subtypes: [],
      }
    );
    setCustomCategories((prev) => [
      ...prev,
      { id: ref.id, label: cleaned, subtypes: [] },
    ]);
    setNewCategory("");
  };

  const handleDeleteCategory = async (catLabel, docId) => {
    try {
      const docRef = doc(db, "users", userId, "zoningCategories", docId);
      await deleteDoc(docRef);
      setCustomCategories((prev) => prev.filter((c) => c.label !== catLabel));
    } catch (error) {
      console.error("❌ Error deleting Firestore doc:", error);
    }
  };

  const addNewSubtype = async () => {
    if (!newSubtype.trim()) return;
    const selectedCat = localData.details?.["Zoning Category"];
    if (defaultCategories.includes(selectedCat)) {
      setDefaultSubtypes((prev) => ({
        ...prev,
        [selectedCat]: [...(prev[selectedCat] || []), newSubtype.trim()],
      }));
      setNewSubtype("");
      return;
    }

    const match = customCategories.find((c) => c.id === activeCategoryDocId);
    if (!match) return;
    const ref = doc(db, "users", userId, "zoningCategories", match.id);
    const updatedSubtypes = [...(match.subtypes || []), newSubtype.trim()];
    await updateDoc(ref, { subtypes: updatedSubtypes });
    setCustomCategories((prev) =>
      prev.map((c) =>
        c.id === match.id ? { ...c, subtypes: updatedSubtypes } : c
      )
    );
    setNewSubtype("");
  };

  const foldersToRender = structure.filter((f) => f.type === "folder");

//   return (
//     <div className="cell-details-panel">
//       <div className="modal-section">
//         {structure
//           .filter((f) => f.type !== "folder")
//           .map((field) => {
//             const { label, type, style, options, dependsOn, map } = field;
//             const value = localData.details?.[label] || "";

//             if (label === "Zoning Category") {
//               return (
//                 <div key={label} className="input-group">
//                   <label>{label}</label>
//                   <div className="button-radio-group">
//                     {[
//                       ...defaultCategories.map((label) => ({ label })),
//                       ...customCategories,
//                     ].map(({ label, id }) => (
//                       <div key={label} className="radio-button-wrapper">
//                         <button
//                           className={
//                             value === label
//                               ? "radio-button active"
//                               : "radio-button"
//                           }
//                           onClick={() => {
//                             handleChange("Zoning Category", label);
//                             setActiveCategoryDocId(id || null);
//                           }}
//                         >
//                           {label}
//                         </button>
//                         {!defaultCategories.includes(label) && (
//                           <span
//                             className="delete-icon"
//                             title={`Delete ${label}`}
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDeleteCategory(label, id);
//                             }}
//                           >
//                             ×
//                           </span>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                   <div
//                     style={{ marginTop: "0.5rem", display: "flex", gap: "6px" }}
//                   >
//                     <input
//                       type="text"
//                       placeholder="Add category"
//                       value={newCategory}
//                       onChange={(e) => setNewCategory(e.target.value)}
//                     />
//                     <button className="btn-save" onClick={addNewCategory}>
//                       ➕
//                     </button>
//                   </div>
//                 </div>
//               );
//             }

//             if (label === "Zoning Subtype") {
//               const selectedCat = localData.details?.["Zoning Category"];
//               const isDefault = defaultCategories.includes(selectedCat);
//               const defaultMap = map?.[selectedCat] || [];
//               const extraDefaults = defaultSubtypes[selectedCat] || [];
//               const found = customCategories.find(
//                 (c) => c.label === selectedCat
//               );
//               const customSubtypes = found?.subtypes || [];
//               const finalSubtypes = isDefault
//                 ? [...new Set([...defaultMap, ...extraDefaults])]
//                 : customSubtypes;

//               return (
//                 <div key={label} className="input-group">
//                   <label>{label}</label>
//                   <select
//                     value={value}
//                     onChange={(e) => handleChange(label, e.target.value)}
//                   >
//                     <option value="">Select</option>
//                     {finalSubtypes.map((opt) => (
//                       <option key={opt} value={opt}>
//                         {opt}
//                       </option>
//                     ))}
//                     {value && !finalSubtypes.includes(value) && (
//                       <option value={value}>{value} (Custom)</option>
//                     )}
//                   </select>
//                   {selectedCat && (
//                     <div
//                       style={{
//                         marginTop: "0.5rem",
//                         display: "flex",
//                         gap: "6px",
//                       }}
//                     >
//                       <input
//                         type="text"
//                         placeholder="Add subtype"
//                         value={newSubtype}
//                         onChange={(e) => setNewSubtype(e.target.value)}
//                       />
//                       <button className="btn-save" onClick={addNewSubtype}>
//                         ➕
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               );
//             }

//             return (
//               <div key={label} className="input-group">
//                 <label>{label}</label>
//                 <input
//                   type={type}
//                   value={value}
//                   onChange={(e) => handleChange(label, e.target.value)}
//                 />
//               </div>
//             );
//           })}

//         {!openFolderLabel && (
//           <div className="folder-grid-group">
//             <div className="folder-grid">
//               {foldersToRender.map(({ label }) => (
//                 <div
//                   key={label}
//                   className="folder-icon"
//                   onClick={() => setOpenFolderLabel(label)}
//                   title={`Open ${label}`}
//                 >
//                   <div className="icon">📁</div>
//                   <div className="label">{label}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//       {openFolderLabel && (
//         <div
//           style={{
//             marginTop: "1rem",
//             borderTop: "1px solid #ccc",
//             paddingTop: "1rem",
//           }}
//         >
//           <button
//             onClick={() => setOpenFolderLabel(null)}
//             style={{ marginBottom: "0.5rem" }}
//           >
//             🔙 Back to folders
//           </button>
//           <EmbeddedFolderExplorer
//             userId={userId}
//             propertyId={propertyId}
//             columnKey={`${columnKey}-${openFolderLabel.replace(/\s+/g, "_")}`}
//           />
//         </div>
//       )}
// {(localData.customInputs || []).map((input, idx) => (
//   <div
//     key={idx}
//     className="input-group"
//     style={{ position: "relative", paddingRight: 24 }}
//   >
//     <label>{input.label || `Custom #${idx + 1}`}</label>
//     <input
//       type="number"
//       value={input.value}
//       onChange={(e) => {
//         const updated = [...localData.customInputs];
//         updated[idx].value = parseFloat(e.target.value) || 0;
//         handleCustomInputChange(updated);
//       }}
//     />
//     <button
//       onClick={() => {
//         const updated = localData.customInputs.filter((_, i) => i !== idx);
//         handleCustomInputChange(updated);
//       }}
//       title="Remove line item"
//       style={{
//         position: "absolute",
//         top: 0,
//         right: 0,
//         border: "none",
//         background: "transparent",
//         color: "#c00",
//         fontSize: "18px",
//         cursor: "pointer",
//         padding: 4,
//         lineHeight: 1,
//       }}
//     >
//       ×
//     </button>
//   </div>
// ))}




//       <button
//   className="btn-save"
//   style={{ marginTop: 10 }}
//   onClick={() => {
//     const label = prompt("Enter a name for the new line item:");
//     if (!label) return;
//     handleCustomInputChange([
//       ...(localData.customInputs || []),
//       { label, value: 0 },
//     ]);
//   }}
// >
//   ➕ Add Line Item
// </button>



//       <div className="panel-footer">
//         <button className="btn-save" onClick={handleSave}>
//           ✅ Save
//         </button>
//       </div>

//       {showFileSidebar && (
//         <FileExplorer
//           userId={userId}
//           propertyId={propertyId}
//           columnKey={columnKey}
//           folderPath={folderPath}
//           setFolderPath={setFolderPath}
//           onClose={() => {
//             setShowFileSidebar(false);
//             setFolderPath([]); // reset to original view
//           }}
//         />
//       )}
//     </div>
//   );
};

export default CellDetailsPanel;
