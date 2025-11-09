import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import "@/styles/components/FileSystem/FileDropZone.css";

/**
 * FileDropZone - Drag-and-drop file upload component
 *
 * Features:
 * - Drag and drop file upload
 * - Click to open file picker
 * - Visual feedback when dragging over
 * - Support for multiple file types
 * - Upload progress indicator
 * - File validation
 *
 * @param {Function} onUpload - Callback when file is uploaded (file) => Promise
 * @param {string} accept - Accepted file types (e.g., "image/*", ".pdf", "*\/*")
 * @param {number} maxSize - Maximum file size in bytes (default: 10MB)
 * @param {boolean} disabled - Whether the drop zone is disabled
 */
function FileDropZone({
  onUpload,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file selection via input
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Validate and upload file
  const handleFileUpload = async (file) => {
    setError(null);

    // Validate file size
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds ${formatFileSize(maxSize)} limit`);
      return;
    }

    // Validate file type if accept is specified
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileName = file.name;
      const fileExt = `.${fileName.split('.').pop()}`;

      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Check MIME type prefix (e.g., "image/*")
          const prefix = type.split('/')[0];
          return fileType.startsWith(prefix);
        } else if (type.startsWith('.')) {
          // Check file extension
          return fileExt.toLowerCase() === type.toLowerCase();
        } else {
          // Check exact MIME type
          return fileType === type;
        }
      });

      if (!isAccepted) {
        setError(`File type not accepted. Accepted types: ${accept}`);
        return;
      }
    }

    // Upload file
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress (in real implementation, this would come from the upload service)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Call the onUpload callback
      await onUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Open file picker when clicking the drop zone
  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      className={`file-drop-zone ${isDragging ? 'file-drop-zone--dragging' : ''} ${
        disabled ? 'file-drop-zone--disabled' : ''
      } ${isUploading ? 'file-drop-zone--uploading' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="file-drop-zone__input"
        aria-label="File input"
      />

      {/* Content */}
      <div className="file-drop-zone__content">
        {isUploading ? (
          <>
            {/* Upload Progress */}
            <div className="file-drop-zone__uploading">
              <div className="file-drop-zone__spinner" />
              <p className="file-drop-zone__text">Uploading...</p>
              <div className="file-drop-zone__progress-bar">
                <div
                  className="file-drop-zone__progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="file-drop-zone__progress-text">{uploadProgress}%</p>
            </div>
          </>
        ) : (
          <>
            {/* Upload Icon */}
            <div className="file-drop-zone__icon">
              {isDragging ? '📥' : '📤'}
            </div>

            {/* Text */}
            <p className="file-drop-zone__text">
              {isDragging
                ? 'Drop file here'
                : 'Drag & drop a file here, or click to select'}
            </p>

            {/* Accepted types info */}
            {accept !== "*/*" && (
              <p className="file-drop-zone__hint">
                Accepted: {accept}
              </p>
            )}

            {/* Max size info */}
            {maxSize && (
              <p className="file-drop-zone__hint">
                Max size: {formatFileSize(maxSize)}
              </p>
            )}
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="file-drop-zone__error">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

FileDropZone.propTypes = {
  onUpload: PropTypes.func.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  disabled: PropTypes.bool,
};

export default FileDropZone;
