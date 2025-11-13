// src/components/FileSystem/FileSystemManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { getFolderSections } from "@/constants/fileSystemStructure";
import {
  getPropertyFiles,
  uploadFile,
  deleteFile,
} from "@/services/firebase/storageService";
import FolderSection from "./FolderSection";
import FileViewer from "./FileViewer";
import "@/styles/components/FileSystem/FileSystemManager.css";

function FileSystemManager({ propertyId, onClose }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const folderSections = getFolderSections();

  // Load all files for this property
  const loadFiles = useCallback(async () => {
    if (!user || !propertyId) return;

    setLoading(true);
    const result = await getPropertyFiles(user.uid, propertyId);
    if (result.success) {
      setFiles(result.files);
    } else {
      console.error("Error loading files:", result.error);
    }
    setLoading(false);
  }, [user, propertyId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (sectionId, subfolderId, file) => {
    if (!user || !propertyId) return;

    const result = await uploadFile(user.uid, propertyId, sectionId, subfolderId, file);
    if (result.success) {
      await loadFiles(); // Refresh file list
      return result;
    } else {
      console.error("Error uploading file:", result.error);
      return result;
    }
  };

  const handleFileDelete = async (fileId, storagePath) => {
    if (!user || !propertyId) return;

    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;

    const result = await deleteFile(user.uid, propertyId, fileId, storagePath);
    if (result.success) {
      await loadFiles(); // Refresh file list
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(null);
      }
    } else {
      console.error("Error deleting file:", result.error);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getFilesForSection = (sectionId, subfolderId) => {
    return files.filter(
      file => file.sectionId === sectionId && file.subfolderId === subfolderId
    );
  };

  return (
    <div className="file-system-manager">
      <div className="file-system-manager__overlay" onClick={onClose} />

      <div className="file-system-manager__container">
        {/* Header */}
        <div className="file-system-manager__header">
          <h2>Property Files</h2>
          <button
            className="file-system-manager__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        {/* Main Content */}
        <div className="file-system-manager__content">
          {/* Folder Tree */}
          <div className="file-system-manager__tree">
            <h3>Folders</h3>
            {loading ? (
              <p>Loading files...</p>
            ) : (
              <div className="folder-tree">
                {folderSections.map((section) => (
                  <FolderSection
                    key={section.id}
                    section={section}
                    isExpanded={expandedSections[section.id]}
                    onToggle={() => toggleSection(section.id)}
                    onFileUpload={handleFileUpload}
                    onFileDelete={handleFileDelete}
                    onFileSelect={setSelectedFile}
                    files={files.filter(f => f.sectionId === section.id)}
                    getFilesForSubfolder={getFilesForSection}
                  />
                ))}
              </div>
            )}
          </div>

          {/* File Viewer */}
          <div className="file-system-manager__viewer">
            {selectedFile ? (
              <FileViewer
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
                onDelete={() => handleFileDelete(selectedFile.id, selectedFile.storagePath)}
              />
            ) : (
              <div className="file-system-manager__empty">
                <p>Select a file to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileSystemManager;
