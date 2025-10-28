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
import "@/styles/components/CellDetailsPanel.css";
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


};

export default CellDetailsPanel;
