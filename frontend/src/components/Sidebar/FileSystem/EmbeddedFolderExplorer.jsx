import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../../services/firebaseConfig.js";
import toast from "react-hot-toast";

const EmbeddedFolderExplorer = ({ userId, propertyId, columnKey }) => {
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const getFolderRef = () => {
    let base = collection(
      db,
      "users",
      userId,
      "properties",
      propertyId,
      "fileSystem",
      columnKey,
      "folders"
    );
    for (const id of path) {
      base = collection(doc(base, id), "folders");
    }
    return base;
  };

  const getFileRef = () => {
    if (path.length === 0) {
      return collection(
        db,
        "users",
        userId,
        "properties",
        propertyId,
        "fileSystem",
        columnKey,
        "files"
      );
    }

    let base = collection(
      db,
      "users",
      userId,
      "properties",
      propertyId,
      "fileSystem",
      columnKey,
      "folders"
    );
    for (let i = 0; i < path.length - 1; i++) {
      base = collection(doc(base, path[i]), "folders");
    }
    return collection(doc(base, path[path.length - 1]), "files");
  };

  useEffect(() => {
    const unsubFolders = onSnapshot(getFolderRef(), (snap) => {
      setFolders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubFolders();
  }, [userId, propertyId, columnKey, JSON.stringify(path)]);

  useEffect(() => {
    const unsubFiles = onSnapshot(getFileRef(), (snap) => {
      setFiles(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubFiles();
  }, [userId, propertyId, columnKey, JSON.stringify(path)]);

  const createFolder = async () => {
    const folderRef = getFolderRef();
    if (!newFolderName.trim()) return;
    await addDoc(folderRef, {
      name: newFolderName.trim(),
      createdAt: new Date(),
    });
    setNewFolderName("");
    toast.success("📁 Folder created");
  };

  const renameFolder = async (folderId, currentName) => {
    const newName = prompt("Rename folder", currentName);
    if (!newName) return;
    await updateDoc(doc(getFolderRef(), folderId), { name: newName });
    toast.success("✏ Folder renamed");
  };

  const deleteFolder = async (folderId) => {
    const confirmed = window.confirm("Delete this folder?");
    if (!confirmed) return;
    await deleteDoc(doc(getFolderRef(), folderId));
    toast.success("🗑 Folder deleted");
  };


  const deleteFile = async (file) => {
  try {
    // Delete from Firebase Storage
    const fileRef = storageRef(storage, file.path);
    await deleteObject(fileRef);

    // Delete from Firestore
    await deleteDoc(doc(getFileRef(), file.id));

    toast.success("🗑 File deleted");
  } catch (err) {
    console.error("❌ Failed to delete file:", err);
    toast.error("❌ Failed to delete file");
  }
};
const traverseAndUpload = async (entry, currentPath = "") => {
  if (entry.isFile) {
    await new Promise((resolve) => {
      entry.file(async (file) => {
        const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;

        const storagePath = [
          "users",
          userId,
          "properties",
          propertyId,
          "fileSystem",
          columnKey,
          ...path.flatMap((id) => [id, "folders"]),
          "files",
          fullPath,
        ].join("/");

        const sRef = storageRef(storage, storagePath);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);

        await addDoc(getFileRef(), {
          name: fullPath,
          url,
          type: file.type,
          path: storagePath,
          createdAt: new Date(),
        });

        toast.success(`📁 Uploaded: ${fullPath}`);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const readEntries = () =>
      new Promise((resolve) => reader.readEntries(resolve));

    let entries = await readEntries();
    while (entries.length) {
      for (const subEntry of entries) {
        await traverseAndUpload(subEntry, `${currentPath}/${entry.name}`);
      }
      entries = await readEntries();
    }
  }
};


const handleDrop = async (e) => {
  e.preventDefault();
  setIsDragging(false);

  const items = Array.from(e.dataTransfer.items);

  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      await traverseAndUpload(entry);
    }
  }
};


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: 12,
        marginTop: 12,
      }}
    >
      <h4 style={{ marginBottom: 8 }}>📁 Files</h4>

      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: 12 }}>
        <span
          onClick={() => setPath([])}
          style={{ cursor: "pointer", color: "blue" }}
        >
          Root
        </span>
        {path.map((id, idx) => (
          <span key={id}>
            {" / "}
            <span
              onClick={() => setPath(path.slice(0, idx + 1))}
              style={{ cursor: "pointer", color: "blue" }}
            >
              {id}
            </span>
          </span>
        ))}
      </div>

      {/* Create folder */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder"
          style={{ flex: 1 }}
        />
        <button onClick={createFolder}>➕</button>
      </div>

      {/* Folder list */}
      {folders.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {folders.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 80,
              }}
            >
              <div
                onClick={() => setPath([...path, f.id])}
                style={{ cursor: "pointer", fontSize: 28 }}
                title="Open"
              >
                📁
              </div>
              <div style={{ fontSize: 12 }}>{f.name}</div>
              <div>
                <button onClick={() => renameFolder(f.id, f.name)}>✏</button>
                <button onClick={() => deleteFolder(f.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          marginTop: 20,
          padding: 16,
          border: isDragging ? "2px dashed #007bff" : "2px dashed #ccc",
          backgroundColor: isDragging ? "#f0f8ff" : "#fff",
          textAlign: "center",
          minHeight: 100,
          borderRadius: 8,
          transition: "all 0.2s ease-in-out",
        }}
      >
        <p style={{ marginBottom: 12, color: "#666" }}>
          Drag files here to upload
        </p>

        {files.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: 10,
            }}
          >
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  backgroundColor: "#fafafa",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {/* Thumbnail */}
                {file.type?.startsWith("image") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 24 }}>📄</span>
                )}

                {/* File name with ellipsis */}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    textDecoration: "none",
                    color: "#007bff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </a>

                {/* Optional delete button */}
                <button
                  onClick={() => deleteFile(file)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 18,
                    color: "#d00",
                    cursor: "pointer",
                  }}
                  title="Delete file"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbeddedFolderExplorer;
