import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { auth, db, storage } from "../../../services/firebaseConfig";
import { deleteFolder as callDeleteFolderCloudFn } from "../../../services/deleteFolder";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import toast from "react-hot-toast";
import { getFolderPath } from "../../../utils/folderUtils";

export default function FileExplorer({ propertyId }) {
  const user = auth.currentUser;
  const [currentPath, setCurrentPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState(null);

  const getFolderRef = () => {
    if (!user || !propertyId || !Array.isArray(currentPath)) {
      console.warn("⚠️ getFolderRef() failed:", {
        user,
        propertyId,
        currentPath,
      });
      return null;
    }

    let ref = collection(
      db,
      "users",
      user.uid,
      "properties",
      propertyId,
      "fileSystem"
    );

    for (const folderId of currentPath) {
      if (!folderId) {
        console.warn("⚠️ Invalid folderId in path:", folderId);
        return null;
      }
      ref = collection(doc(ref, folderId), "folders");
    }

    console.log("✅ Folder Ref Path:", ref.path);
    return ref;
  };

  const getFileRef = () => {
    if (!user || !propertyId) return null;
    let ref = collection(
      db,
      "users",
      user.uid,
      "properties",
      propertyId,
      "fileSystem"
    );
    for (const folderId of currentPath.slice(0, -1)) {
      ref = collection(doc(ref, folderId), "folders");
    }
    const lastId = currentPath[currentPath.length - 1];
    return currentPath.length === 0
      ? collection(
          db,
          "users",
          user.uid,
          "properties",
          propertyId,
          "fileSystem",
          "README",
          "files"
        )
      : collection(doc(ref, lastId), "files");
  };

  useEffect(() => {
    const ref = getFolderRef();
    if (!ref) return;
    const unsub = onSnapshot(ref, (snap) => {
      setFolders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user, propertyId, currentPath]);

  useEffect(() => {
    const ref = getFileRef();
    if (!ref) return;
    const unsub = onSnapshot(ref, (snap) => {
      setFiles(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user, propertyId, currentPath]);

  const createFolder = async () => {
    console.log("➕ New Folder clicked");
    const ref = getFolderRef();
    if (!ref || !newFolderName.trim()) {
      console.warn("Missing ref or folder name");
      return;
    }

    try {
      await addDoc(ref, {
        name: newFolderName.trim(),
        createdAt: new Date(),
      });
      setNewFolderName(""); // clear input after creation
      toast.success("Folder created!");
    } catch (err) {
      console.error("Failed to create folder:", err);
      toast.error("Failed to create folder.");
    }
  };

  const renameFolder = async (folderId, currentName) => {
    const newName = prompt("Rename folder:", currentName);
    if (!newName) return;

    const folderRef = getFolderRef();
    if (!folderRef) {
      toast.error("Invalid folder reference");
      return;
    }

    try {
      await updateDoc(doc(folderRef, folderId), { name: newName });
      toast.success("Folder renamed.");
    } catch (err) {
      console.error("Error renaming folder:", err);
      toast.error("Failed to rename folder.");
    }
  };

  
  const handleDeleteFolderClick = (folderId) => {
    setPendingDeleteFolderId(folderId); // show modal
  };

  const confirmDeleteFolder = async () => {
    if (!pendingDeleteFolderId || !user || !propertyId) return;
  
    const fullPathArray = [...currentPath, pendingDeleteFolderId];
    const folderPath = fullPathArray.join("/folders/");
    console.log("🔥 Deleting folder at:", folderPath);
  
    try {
      await callDeleteFolderCloudFn({ userId: user.uid, propertyId, folderPath });
      toast.success("Folder deleted!");
    } catch (err) {
      console.error("❌ Failed to delete folder:", err);
      toast.error("Failed to delete folder.");
    } finally {
      setPendingDeleteFolderId(null);
    }
  };
  

  
  

  const handleUpload = async (file) => {
    const ref = getFileRef();
    if (!ref) return;

    const storagePath = [
      user.uid,
      "properties",
      propertyId,
      "fileSystem",
      ...currentPath.flatMap((id) => [id, "folders"]),
      "files",
      file.name,
    ].join("/");

    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(ref, {
      name: file.name,
      url,
      type: file.type,
      path: storagePath,
      createdAt: new Date(),
    });
  };

  const handleDeleteFolder = async (folderId) => {
    console.log("🗑️ Delete clicked for:", folderId);
    const confirmDelete = window.confirm("Delete this folder and its contents?");
    if (!confirmDelete || !user || !propertyId) return;
  
    const fullPathArray = [...currentPath, folderId];
    const folderPath = getFolderPath(fullPathArray);
    console.log("🔥 Deleting folder at:", folderPath);
  
    try {
      await callDeleteFolderCloudFn({ userId: user.uid, propertyId, folderPath });
      toast.success("Folder deleted!");
    } catch (err) {
      console.error("❌ Failed to delete folder:", err);
      toast.error("Failed to delete folder.");
    }
  };
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: 16 }}>
        <h3>📁 File System</h3>

        {currentPath.length > 0 && (
          <button onClick={() => setCurrentPath(currentPath.slice(0, -1))}>
            🔙 Back
          </button>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
            style={{ flex: 1, padding: "6px" }}
          />
          <button onClick={createFolder}>➕ New Folder</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {folders.map((folder) => (
            <div key={folder.id} style={{ marginBottom: 6 }}>
              <span
                onClick={() => {
                  console.log("🗂️ Folder clicked:", folder.id);
                  setCurrentPath([...currentPath, folder.id]);
                }}
                style={{ cursor: "pointer" }}
              >
                📂 {folder.name}
              </span>
              <button
                onClick={() => {
                  console.log("✏️ Rename clicked for:", folder.id);
                  renameFolder(folder.id, folder.name);
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  console.log("🗑️ Delete clicked for:", folder.id);
                  handleDeleteFolderClick(folder.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          style={{ width: "100%", marginTop: 10, padding: 4 }}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            Array.from(e.dataTransfer.files).forEach((file) => {
              console.log("📤 Uploading file:", file.name);
              handleUpload(file);
            });
          }}
          style={{
            border: "2px dashed #ccc",
            padding: 12,
            marginTop: 12,
            minHeight: 200,
          }}
        >
          {files
            .filter((file) =>
              file.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((file) => (
              <div key={file.id} style={{ marginBottom: 8 }}>
                🧾 {file.name}
                <button
                  onClick={() => {
                    console.log("❌ Deleting file:", file.name);
                    handleDeleteFile(file);
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          {files.length === 0 && (
            <p style={{ textAlign: "center", color: "#777" }}>
              No files found.
            </p>
          )}
        </div>
        {pendingDeleteFolderId && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        minWidth: 300,
        textAlign: "center",
      }}
    >
      <p>Are you sure you want to delete this folder?</p>
      <div style={{ marginTop: 12 }}>
        <button
          onClick={confirmDeleteFolder}
          style={{ marginRight: 8, padding: "6px 12px" }}
        >
          Yes, delete
        </button>
        <button
          onClick={() => setPendingDeleteFolderId(null)}
          style={{ padding: "6px 12px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </DndProvider>
  );
}
