# FileSystem Components - Usage Examples

## Quick Start

### Basic Integration

```jsx
import React, { useState, useCallback } from 'react';
import FolderSection from '@/components/FileSystem/FolderSection';
import FileViewer from '@/components/FileSystem/FileViewer';
import FileDropZone from '@/components/FileSystem/FileDropZone';
import { getFolderSections } from '@/constants/fileSystemStructure';

function MyFileManager({ propertyId }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const folderSections = getFolderSections();

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Upload file
  const handleFileUpload = async (sectionId, subfolderId, file) => {
    // Your upload logic here
    console.log('Uploading file:', file.name, 'to', sectionId, subfolderId);
  };

  // Get files for specific subfolder
  const getFilesForSubfolder = (sectionId, subfolderId) => {
    return files.filter(
      f => f.sectionId === sectionId && f.subfolderId === subfolderId
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left: Folder Tree */}
      <div style={{ width: '350px', overflowY: 'auto', padding: '16px' }}>
        {folderSections.map(section => (
          <FolderSection
            key={section.id}
            section={section}
            isExpanded={expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
            onFileUpload={handleFileUpload}
            onFileSelect={setSelectedFile}
            files={files.filter(f => f.sectionId === section.id)}
            getFilesForSubfolder={getFilesForSubfolder}
          />
        ))}
      </div>

      {/* Right: File Viewer */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selectedFile ? (
          <FileViewer
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDelete={() => console.log('Delete:', selectedFile.id)}
          />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Select a file to view
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Example 1: Simple File Upload Zone

```jsx
import FileDropZone from '@/components/FileSystem/FileDropZone';

function SimpleUpload() {
  const handleUpload = async (file) => {
    console.log('Uploading:', file.name);
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Upload complete!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Upload Your Document</h2>
      <FileDropZone onUpload={handleUpload} />
    </div>
  );
}
```

---

## Example 2: Image-Only Upload

```jsx
import FileDropZone from '@/components/FileSystem/FileDropZone';

function ImageUpload() {
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('Image uploaded successfully!');
    }
  };

  return (
    <FileDropZone
      onUpload={handleUpload}
      accept="image/*"
      maxSize={5 * 1024 * 1024} // 5MB
    />
  );
}
```

---

## Example 3: PDF Viewer

```jsx
import FileViewer from '@/components/FileSystem/FileViewer';

function PDFViewer() {
  const pdfFile = {
    id: '123',
    name: 'Contract.pdf',
    url: 'https://example.com/contract.pdf',
    size: 1024000,
    type: 'application/pdf',
    uploadedAt: new Date()
  };

  return (
    <div style={{ height: '100vh' }}>
      <FileViewer
        file={pdfFile}
        onDelete={() => console.log('Delete PDF')}
      />
    </div>
  );
}
```

---

## Example 4: Custom Folder Section

```jsx
import FolderSection from '@/components/FileSystem/FolderSection';

function CustomFolderView() {
  const customSection = {
    id: 'documents',
    label: 'My Documents',
    subfolders: [
      { id: 'contracts', label: 'Contracts' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'receipts', label: 'Receipts' }
    ]
  };

  const files = [
    {
      id: '1',
      name: 'contract-2024.pdf',
      sectionId: 'documents',
      subfolderId: 'contracts',
      size: 500000,
      uploadedAt: new Date()
    }
  ];

  const [expanded, setExpanded] = useState(true);

  return (
    <FolderSection
      section={customSection}
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      onFileUpload={(sectionId, subfolderId, file) => {
        console.log('Upload to:', sectionId, subfolderId, file);
      }}
      onFileSelect={(file) => console.log('Selected:', file)}
      files={files}
    />
  );
}
```

---

## Example 5: With Firebase Integration

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  uploadFile,
  deleteFile,
  getPropertyFiles
} from '@/services/firebase/storageService';
import FileSystemManager from '@/components/FileSystem/FileSystemManager';

function PropertyFiles({ propertyId }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [propertyId]);

  const loadFiles = async () => {
    const result = await getPropertyFiles(user.uid, propertyId);
    if (result.success) {
      setFiles(result.files);
    }
  };

  const handleUpload = async (sectionId, subfolderId, file) => {
    const result = await uploadFile(
      user.uid,
      propertyId,
      sectionId,
      subfolderId,
      file
    );

    if (result.success) {
      await loadFiles(); // Refresh file list
      return result;
    }
    throw new Error(result.error);
  };

  const handleDelete = async (fileId, storagePath) => {
    if (!confirm('Delete this file?')) return;

    const result = await deleteFile(user.uid, propertyId, fileId, storagePath);
    if (result.success) {
      await loadFiles();
      setSelectedFile(null);
    }
  };

  return (
    <FileSystemManager
      propertyId={propertyId}
      onClose={() => console.log('Close manager')}
    />
  );
}
```

---

## Example 6: With Loading States

```jsx
import { useState } from 'react';
import FileDropZone from '@/components/FileSystem/FileDropZone';

function UploadWithStates() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure
      if (Math.random() > 0.5) {
        setSuccess(true);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <FileDropZone
        onUpload={handleUpload}
        disabled={isUploading}
      />

      {success && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          ✓ Upload successful!
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
```

---

## Example 7: File Gallery View

```jsx
import { useState } from 'react';
import FileViewer from '@/components/FileSystem/FileViewer';

function FileGallery({ files }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedFile = files[selectedIndex];

  const goNext = () => {
    setSelectedIndex((prev) => (prev + 1) % files.length);
  };

  const goPrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px' }}>
        <button onClick={goPrevious}>← Previous</button>
        <span>{selectedIndex + 1} / {files.length}</span>
        <button onClick={goNext}>Next →</button>
      </div>

      {/* Viewer */}
      <FileViewer
        file={selectedFile}
        onDelete={() => console.log('Delete:', selectedFile.id)}
      />
    </div>
  );
}
```

---

## Example 8: Multiple File Types

```jsx
import FileDropZone from '@/components/FileSystem/FileDropZone';

function DocumentUpload() {
  return (
    <div>
      <h3>Upload Documents</h3>
      <p>Accepts: PDF, Word, Excel, Images</p>

      <FileDropZone
        onUpload={async (file) => console.log('Upload:', file)}
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        maxSize={20 * 1024 * 1024} // 20MB
      />
    </div>
  );
}
```

---

## Example 9: Controlled Expansion State

```jsx
import { useState } from 'react';
import FolderSection from '@/components/FileSystem/FolderSection';

function ControlledFolders() {
  const [expandedSections, setExpandedSections] = useState({
    propertyAddress: true,
    propertyTaxes: false,
    financing: false
  });

  const sections = [
    /* your sections */
  ];

  // Expand all
  const expandAll = () => {
    const allExpanded = {};
    sections.forEach(s => allExpanded[s.id] = true);
    setExpandedSections(allExpanded);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedSections({});
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
      </div>

      {sections.map(section => (
        <FolderSection
          key={section.id}
          section={section}
          isExpanded={expandedSections[section.id]}
          onToggle={() => setExpandedSections(prev => ({
            ...prev,
            [section.id]: !prev[section.id]
          }))}
          {/* other props */}
        />
      ))}
    </div>
  );
}
```

---

## Example 10: Search and Filter

```jsx
import { useState, useMemo } from 'react';
import FolderSection from '@/components/FileSystem/FolderSection';

function SearchableFiles({ files, sections }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  // Filter files by search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;

    return files.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, searchTerm]);

  // Auto-expand sections with matching files
  useEffect(() => {
    if (searchTerm) {
      const sectionsWithMatches = {};
      filteredFiles.forEach(file => {
        sectionsWithMatches[file.sectionId] = true;
      });
      setExpandedSections(sectionsWithMatches);
    }
  }, [searchTerm, filteredFiles]);

  return (
    <div>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />

      {/* Results count */}
      {searchTerm && (
        <p style={{ fontSize: '14px', color: '#666' }}>
          Found {filteredFiles.length} file(s)
        </p>
      )}

      {/* Folder Sections */}
      {sections.map(section => {
        const sectionFiles = filteredFiles.filter(
          f => f.sectionId === section.id
        );

        // Hide sections with no matching files when searching
        if (searchTerm && sectionFiles.length === 0) {
          return null;
        }

        return (
          <FolderSection
            key={section.id}
            section={section}
            isExpanded={expandedSections[section.id]}
            onToggle={() => setExpandedSections(prev => ({
              ...prev,
              [section.id]: !prev[section.id]
            }))}
            files={sectionFiles}
            {/* other props */}
          />
        );
      })}
    </div>
  );
}
```

---

## Tips for Production Use

### 1. Error Handling
Always wrap upload/delete operations in try-catch blocks and provide user feedback.

### 2. Loading States
Show loading indicators during file operations to improve UX.

### 3. File Validation
Validate files on both client and server side for security.

### 4. Optimistic Updates
Update UI immediately, then sync with server for better perceived performance.

### 5. Keyboard Shortcuts
Add keyboard shortcuts for common operations (Delete, Download, etc.).

### 6. Accessibility
Test with screen readers and ensure keyboard navigation works properly.

### 7. Mobile Support
Test on mobile devices and ensure touch interactions work smoothly.

### 8. Performance
Lazy load file previews and implement virtual scrolling for large file lists.

### 9. Caching
Cache file metadata to reduce server requests.

### 10. Analytics
Track user interactions for insights into feature usage.
