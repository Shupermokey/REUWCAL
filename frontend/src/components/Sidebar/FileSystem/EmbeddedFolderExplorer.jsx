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
import { db, storage } from "../../../services/firebaseConfig.js"
import toast from "react-hot-toast";

const EmbeddedFolderExplorer = ({ userId, propertyId, columnKey }) => {
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [search, setSearch] = useState("");

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
    const folderRef = getFolderRef();
    const unsub = onSnapshot(folderRef, (snap) => {
      setFolders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [userId, propertyId, columnKey, JSON.stringify(path)]);

  useEffect(() => {
    const fileRef = getFileRef();
    const unsub = onSnapshot(fileRef, (snap) => {
      setFiles(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [userId, propertyId, columnKey, JSON.stringify(path)]);

  const createFolder = async () => {
    const folderRef = getFolderRef();
    if (!newFolderName.trim()) return;
    await addDoc(folderRef, {
      name: newFolderName.trim(),
      createdAt: new Date(),
    });
    setNewFolderName("");
    toast.success("Folder created");
  };

  const renameFolder = async (folderId, currentName) => {
    const newName = prompt("Rename folder", currentName);
    if (!newName) return;
    const folderRef = getFolderRef();
    await updateDoc(doc(folderRef, folderId), { name: newName });
  };

  const deleteFolder = async (folderId) => {
    const confirmed = window.confirm("Delete this folder?");
    if (!confirmed) return;
    const folderRef = getFolderRef();
    await deleteDoc(doc(folderRef, folderId));
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.files);

    for (const file of items) {
      const ref = getFileRef();
      const storagePath = [
        userId,
        "properties",
        propertyId,
        "fileSystem",
        columnKey,
        ...path.flatMap((id) => [id, "folders"]),
        "files",
        file.name,
      ].join("/");

      const sRef = storageRef(storage, storagePath);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      await addDoc(ref, {
        name: file.name,
        url,
        type: file.type,
        path: storagePath,
        createdAt: new Date(),
      });
    }
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

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          marginTop: 20,
          padding: 20,
          border: "2px dashed #aaa",
          textAlign: "center",
          minHeight: 100,
        }}
      >
        <p>Drag files here to upload</p>
        {files.length > 0 &&
          files
            .filter((file) =>
              file.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((file) => (
              <div key={file.id} style={{ marginTop: 6 }}>
                🧾 {file.name}
              </div>
            ))}
      </div>
    </div>
  );
};

export default EmbeddedFolderExplorer;
