import React, { useState } from "react";
import PropTypes from "prop-types";
import "@/styles/components/FileSystem/FileViewer.css";

/**
 * FileViewer - Displays the selected file with preview and actions
 *
 * Features:
 * - Shows file metadata (name, size, type, upload date)
 * - Image preview for supported formats (jpg, png, gif, etc.)
 * - PDF viewer using iframe
 * - Download button for all file types
 * - Delete button with confirmation
 * - Generic file icon for unsupported preview types
 *
 * @param {Object} file - The file object to display
 * @param {Function} onClose - Callback to close the viewer
 * @param {Function} onDelete - Callback to delete the file
 */
function FileViewer({ file, onClose, onDelete }) {
  const [imageError, setImageError] = useState(false);

  if (!file) {
    return (
      <div className="file-viewer">
        <div className="file-viewer__empty">
          <p>No file selected</p>
        </div>
      </div>
    );
  }

  // Determine file type from extension
  const getFileType = () => {
    const ext = file.name.split('.').pop().toLowerCase();

    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const documentTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (ext === 'pdf') return 'pdf';
    if (imageTypes.includes(ext)) return 'image';
    if (documentTypes.includes(ext)) return 'document';
    if (archiveTypes.includes(ext)) return 'archive';

    return 'other';
  };

  const fileType = getFileType();

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format upload date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    let date;
    if (timestamp?.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return "Unknown";
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle download
  const handleDownload = () => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      onDelete();
    }
  };

  // Get file icon
  const getFileIcon = () => {
    const iconMap = {
      pdf: "📄",
      image: "🖼️",
      document: "📝",
      archive: "📦",
      other: "📎"
    };
    return iconMap[fileType] || iconMap.other;
  };

  // Render file preview based on type
  const renderPreview = () => {
    if (fileType === 'image' && !imageError) {
      return (
        <div className="file-viewer__preview file-viewer__preview--image">
          <img
            src={file.url}
            alt={file.name}
            onError={() => setImageError(true)}
            className="file-viewer__image"
          />
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="file-viewer__preview file-viewer__preview--pdf">
          <iframe
            src={file.url}
            title={file.name}
            className="file-viewer__pdf"
          />
          <p className="file-viewer__pdf-note">
            If the PDF doesn't display, click the download button below.
          </p>
        </div>
      );
    }

    // Generic preview for other file types
    return (
      <div className="file-viewer__preview file-viewer__preview--generic">
        <div className="file-viewer__icon-large">
          {getFileIcon()}
        </div>
        <p className="file-viewer__type-label">
          {file.name.split('.').pop().toUpperCase()} File
        </p>
        <p className="file-viewer__preview-note">
          No preview available. Click download to view this file.
        </p>
      </div>
    );
  };

  return (
    <div className="file-viewer">
      {/* Header */}
      <div className="file-viewer__header">
        <div className="file-viewer__title">
          <span className="file-viewer__icon">{getFileIcon()}</span>
          <h3>{file.name}</h3>
        </div>
        {onClose && (
          <button
            className="file-viewer__close"
            onClick={onClose}
            aria-label="Close viewer"
          >
            ✖
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="file-viewer__metadata">
        <div className="file-viewer__meta-item">
          <span className="file-viewer__meta-label">Size:</span>
          <span className="file-viewer__meta-value">{formatFileSize(file.size)}</span>
        </div>
        <div className="file-viewer__meta-item">
          <span className="file-viewer__meta-label">Type:</span>
          <span className="file-viewer__meta-value">
            {file.type || file.name.split('.').pop().toUpperCase()}
          </span>
        </div>
        <div className="file-viewer__meta-item">
          <span className="file-viewer__meta-label">Uploaded:</span>
          <span className="file-viewer__meta-value">
            {formatDate(file.uploadedAt || file.createdAt)}
          </span>
        </div>
      </div>

      {/* Preview */}
      {renderPreview()}

      {/* Actions */}
      <div className="file-viewer__actions">
        <button
          className="file-viewer__btn file-viewer__btn--download"
          onClick={handleDownload}
        >
          ⬇ Download
        </button>
        {onDelete && (
          <button
            className="file-viewer__btn file-viewer__btn--delete"
            onClick={handleDelete}
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
}

FileViewer.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    url: PropTypes.string,
    size: PropTypes.number,
    type: PropTypes.string,
    uploadedAt: PropTypes.any,
    createdAt: PropTypes.any,
  }),
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
};

export default FileViewer;
