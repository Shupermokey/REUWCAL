# File System Manager Components

A comprehensive set of React components for managing and viewing property files in the REUWCAL application.

## Components Overview

### 1. **FolderSection.jsx**
A component that displays a collapsible folder section with expandable subfolders.

#### Features
- Expandable/collapsible section with chevron icon
- Shows subfolders with file upload zones
- Displays files in each subfolder with icons
- Click to select files
- File count display

#### Props
```javascript
{
  section: {
    id: string,           // Section identifier
    label: string,        // Display name
    subfolders: [{
      id: string,         // Subfolder identifier
      label: string       // Subfolder display name
    }]
  },
  isExpanded: boolean,    // Whether section is expanded
  onToggle: Function,     // Callback to toggle expansion
  onFileUpload: Function, // (sectionId, subfolderId, file) => Promise
  onFileSelect: Function, // (file) => void
  files: Array,           // Array of file objects
  getFilesForSubfolder: Function  // (sectionId, subfolderId) => Array
}
```

#### Usage Example
```jsx
<FolderSection
  section={PROPERTY_FOLDERS.PROPERTY_ADDRESS}
  isExpanded={expandedSections['propertyAddress']}
  onToggle={() => toggleSection('propertyAddress')}
  onFileUpload={handleFileUpload}
  onFileSelect={setSelectedFile}
  files={files}
  getFilesForSubfolder={getFilesForSection}
/>
```

---

### 2. **FileViewer.jsx**
A component that displays the selected file with preview capabilities and action buttons.

#### Features
- File metadata display (name, size, type, upload date)
- Image preview for JPG, PNG, GIF, BMP, WEBP, SVG
- PDF viewer using iframe
- Download button for all file types
- Delete button with confirmation
- Generic icon view for unsupported preview types
- Error handling for failed image loads

#### Props
```javascript
{
  file: {
    id: string,
    name: string,
    url: string,
    size: number,          // Size in bytes
    type: string,          // MIME type
    uploadedAt: Timestamp, // Firestore Timestamp or Date
    createdAt: Timestamp
  },
  onClose: Function,       // () => void
  onDelete: Function       // () => void
}
```

#### Usage Example
```jsx
<FileViewer
  file={selectedFile}
  onClose={() => setSelectedFile(null)}
  onDelete={() => handleFileDelete(selectedFile.id, selectedFile.storagePath)}
/>
```

---

### 3. **FileDropZone.jsx**
A drag-and-drop component for uploading files.

#### Features
- Drag and drop file upload
- Click to open file picker
- Visual feedback during drag
- Support for multiple file types with validation
- Upload progress indicator
- File size validation
- File type validation
- Error messages

#### Props
```javascript
{
  onUpload: Function,     // (file) => Promise - Called when file is uploaded
  accept: string,         // Accepted file types (default: "*/*")
                          // Examples: "image/*", ".pdf,.doc", "*/*"
  maxSize: number,        // Max file size in bytes (default: 10MB)
  disabled: boolean       // Whether drop zone is disabled (default: false)
}
```

#### Usage Example
```jsx
<FileDropZone
  onUpload={(file) => handleFileUpload('propertyAddress', 'zoningMap', file)}
  accept="image/*,.pdf"
  maxSize={15 * 1024 * 1024} // 15MB
/>
```

---

## File Structure

```
frontend/src/
├── components/
│   └── FileSystem/
│       ├── FileSystemManager.jsx    # Main container component
│       ├── FolderSection.jsx        # Folder section component
│       ├── FileViewer.jsx           # File preview component
│       ├── FileDropZone.jsx         # File upload component
│       └── README.md                # This file
└── styles/
    └── components/
        └── FileSystem/
            ├── FileSystemManager.css
            ├── FolderSection.css
            ├── FileViewer.css
            └── FileDropZone.css
```

---

## Integration with FileSystemManager

The `FileSystemManager.jsx` component uses all three components together:

```jsx
import FolderSection from "./FolderSection";
import FileViewer from "./FileViewer";

function FileSystemManager({ propertyId, onClose }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  return (
    <div className="file-system-manager">
      {/* Folder Tree */}
      <div className="file-system-manager__tree">
        {folderSections.map((section) => (
          <FolderSection
            key={section.id}
            section={section}
            isExpanded={expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
            onFileUpload={handleFileUpload}
            onFileSelect={setSelectedFile}
            files={files.filter(f => f.sectionId === section.id)}
            getFilesForSubfolder={getFilesForSection}
          />
        ))}
      </div>

      {/* File Viewer */}
      <div className="file-system-manager__viewer">
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={() => handleFileDelete(selectedFile.id)}
        />
      </div>
    </div>
  );
}
```

---

## Styling

All components use CSS custom properties (CSS variables) for theming. You can customize the appearance by overriding these variables:

```css
:root {
  /* Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-light: #f8f9fa;
  --bg-hover: #e9ecef;
  --bg-active: #e3f2fd;

  --text-primary: #212529;
  --text-secondary: #6c757d;

  --border-color: #dee2e6;
  --border-light: #e9ecef;

  --primary-color: #2196f3;
  --primary-light: #64b5f6;
  --primary-dark: #1976d2;

  --success-color: #28a745;
  --danger-color: #dc3545;
  --danger-dark: #c82333;
}
```

---

## File Object Structure

All components expect file objects with the following structure:

```javascript
{
  id: string,              // Unique identifier
  name: string,            // File name with extension
  url: string,             // Download URL from Firebase Storage
  size: number,            // File size in bytes
  type: string,            // MIME type (e.g., "image/png", "application/pdf")
  sectionId: string,       // Section identifier
  subfolderId: string,     // Subfolder identifier
  storagePath: string,     // Full path in Firebase Storage
  uploadedAt: Timestamp,   // Firestore Timestamp
  createdAt: Timestamp     // Firestore Timestamp
}
```

---

## Best Practices

### 1. File Upload
- Always validate file types and sizes before upload
- Show progress feedback to users
- Handle upload errors gracefully
- Clear the file input after successful upload

### 2. File Display
- Use lazy loading for images when possible
- Provide fallback UI for unsupported file types
- Show clear error messages when previews fail
- Always offer download option

### 3. User Experience
- Maintain expanded/collapsed state in parent component
- Provide visual feedback for all interactions
- Use keyboard navigation where possible
- Keep file lists organized and searchable

### 4. Performance
- Only load files when sections are expanded
- Implement pagination for large file lists
- Optimize image previews with appropriate sizing
- Cache file metadata to reduce Firestore reads

---

## Accessibility Features

All components include accessibility features:

- **ARIA labels** for buttons and interactive elements
- **Keyboard navigation** support
- **Focus states** for interactive elements
- **Alt text** for images
- **Screen reader friendly** structure

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Drag and drop: All modern browsers
- PDF preview: Works in browsers with PDF plugin
- Image preview: All browsers with image support

---

## Future Enhancements

Potential improvements to consider:

1. **Multi-file upload** - Allow dropping multiple files at once
2. **File search** - Add search/filter functionality
3. **Thumbnails** - Generate and display thumbnails for images
4. **Bulk operations** - Select and delete multiple files
5. **File versioning** - Track and display file history
6. **Sorting** - Sort files by name, date, size, type
7. **Breadcrumbs** - Show current location in folder hierarchy
8. **Context menu** - Right-click menu for file operations
9. **Drag to reorder** - Reorder files within folders
10. **File preview modal** - Full-screen preview with navigation

---

## Dependencies

- **React** (^18.3.1)
- **PropTypes** - For prop validation
- **CSS** - No external CSS frameworks required

---

## Testing

Example test cases to consider:

```javascript
describe('FolderSection', () => {
  it('should expand when clicked');
  it('should show subfolders when expanded');
  it('should upload files to correct subfolder');
  it('should select file when clicked');
});

describe('FileViewer', () => {
  it('should display file metadata');
  it('should preview images correctly');
  it('should preview PDFs correctly');
  it('should download files');
  it('should delete files with confirmation');
});

describe('FileDropZone', () => {
  it('should accept dropped files');
  it('should open file picker on click');
  it('should validate file types');
  it('should validate file sizes');
  it('should show upload progress');
  it('should display errors');
});
```

---

## Troubleshooting

### Common Issues

**PDF not displaying in iframe:**
- Browser PDF plugin may be disabled
- CORS issues with Firebase Storage URLs
- Solution: Always provide download button

**Images not loading:**
- Check Firebase Storage CORS configuration
- Verify file URLs are public or properly authenticated
- Check network tab for errors

**Upload fails silently:**
- Check Firebase Storage rules
- Verify user authentication
- Check file size limits
- Review console for errors

**Styles not applying:**
- Verify CSS imports are correct
- Check CSS variable definitions
- Ensure proper CSS module configuration

---

## License

Part of the REUWCAL project.
