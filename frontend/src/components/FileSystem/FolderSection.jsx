import React, { useState } from "react";
import PropTypes from "prop-types";
import FileDropZone from "./FileDropZone";
import "@/styles/components/FileSystem/FolderSection.css";

/**
 * FolderSection - Displays a folder section with expandable subfolders
 *
 * Features:
 * - Expandable/collapsible section with chevron icon
 * - Shows subfolders with file upload zones
 * - Displays files in each subfolder
 * - Allows file selection on click
 *
 * @param {Object} section - The folder section configuration
 * @param {boolean} isExpanded - Whether the section is expanded
 * @param {Function} onToggle - Callback to toggle section expansion
 * @param {Function} onFileUpload - Callback for file uploads (sectionId, subfolderId, file)
 * @param {Function} onFileSelect - Callback when a file is selected
 * @param {Array} files - Array of files for this section
 * @param {Function} getFilesForSubfolder - Function to get files for a specific subfolder
 */
function FolderSection({
  section,
  isExpanded = false,
  onToggle,
  onFileUpload,
  onFileSelect,
  files = [],
  getFilesForSubfolder,
}) {
  const [expandedSubfolders, setExpandedSubfolders] = useState({});

  // Toggle subfolder expansion
  const toggleSubfolder = (subfolderId) => {
    setExpandedSubfolders(prev => ({
      ...prev,
      [subfolderId]: !prev[subfolderId]
    }));
  };

  // Handle file upload for a specific subfolder
  const handleFileUpload = async (subfolderId, file) => {
    if (onFileUpload) {
      await onFileUpload(section.id, subfolderId, file);
    }
  };

  // Get files for a specific subfolder
  const getSubfolderFiles = (subfolderId) => {
    if (getFilesForSubfolder) {
      return getFilesForSubfolder(section.id, subfolderId);
    }
    return files.filter(f => f.subfolderId === subfolderId);
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: "📄",
      doc: "📝",
      docx: "📝",
      xls: "📊",
      xlsx: "📊",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      zip: "📦",
      default: "📎"
    };
    return iconMap[ext] || iconMap.default;
  };

  return (
    <div className="folder-section">
      {/* Section Header */}
      <div className="folder-section__header" onClick={onToggle}>
        <button
          className="folder-section__chevron"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        <span className="folder-section__icon">📁</span>
        <span className="folder-section__name">{section.label}</span>
        <span className="folder-section__count">
          ({files.length} {files.length === 1 ? 'file' : 'files'})
        </span>
      </div>

      {/* Subfolders */}
      {isExpanded && (
        <div className="folder-section__subfolders">
          {section.subfolders.map((subfolder) => {
            const subfolderFiles = getSubfolderFiles(subfolder.id);
            const isSubfolderExpanded = expandedSubfolders[subfolder.id];

            return (
              <div key={subfolder.id} className="subfolder">
                {/* Subfolder Header */}
                <div
                  className="subfolder__header"
                  onClick={() => toggleSubfolder(subfolder.id)}
                >
                  <button
                    className="subfolder__chevron"
                    aria-label={isSubfolderExpanded ? "Collapse subfolder" : "Expand subfolder"}
                  >
                    {isSubfolderExpanded ? "▼" : "▶"}
                  </button>
                  <span className="subfolder__icon">📂</span>
                  <span className="subfolder__name">{subfolder.label}</span>
                  <span className="subfolder__count">
                    ({subfolderFiles.length})
                  </span>
                </div>

                {/* Subfolder Content */}
                {isSubfolderExpanded && (
                  <div className="subfolder__content">
                    {/* File Drop Zone */}
                    <FileDropZone
                      onUpload={(file) => handleFileUpload(subfolder.id, file)}
                      accept="*/*"
                    />

                    {/* File List */}
                    {subfolderFiles.length > 0 && (
                      <div className="subfolder__files">
                        {subfolderFiles.map((file) => (
                          <div
                            key={file.id}
                            className="file-item"
                            onClick={() => onFileSelect(file)}
                          >
                            <span className="file-item__icon">
                              {getFileIcon(file.name)}
                            </span>
                            <div className="file-item__info">
                              <span className="file-item__name" title={file.name}>
                                {file.name}
                              </span>
                              <span className="file-item__size">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

FolderSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    subfolders: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  files: PropTypes.array,
  getFilesForSubfolder: PropTypes.func,
};

export default FolderSection;
