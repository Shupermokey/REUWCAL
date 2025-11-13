# FileSystem Components - API Reference

Quick reference guide for all component props, methods, and CSS classes.

---

## FolderSection Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `section` | `Object` | Yes | - | Section configuration object |
| `section.id` | `string` | Yes | - | Unique section identifier |
| `section.label` | `string` | Yes | - | Display name for section |
| `section.subfolders` | `Array<Object>` | Yes | - | Array of subfolder objects |
| `isExpanded` | `boolean` | No | `false` | Whether section is expanded |
| `onToggle` | `Function` | Yes | - | Called when section is toggled |
| `onFileUpload` | `Function` | Yes | - | Called when file is uploaded: `(sectionId, subfolderId, file) => Promise` |
| `onFileSelect` | `Function` | Yes | - | Called when file is selected: `(file) => void` |
| `files` | `Array<Object>` | No | `[]` | Array of file objects for this section |
| `getFilesForSubfolder` | `Function` | No | - | Get files for subfolder: `(sectionId, subfolderId) => Array` |

### CSS Classes

```css
.folder-section                    /* Main container */
.folder-section__header            /* Section header (clickable) */
.folder-section__chevron           /* Expand/collapse button */
.folder-section__icon              /* Folder icon */
.folder-section__name              /* Section name */
.folder-section__count             /* File count badge */
.folder-section__subfolders        /* Subfolders container */

.subfolder                         /* Subfolder container */
.subfolder__header                 /* Subfolder header (clickable) */
.subfolder__chevron                /* Expand/collapse button */
.subfolder__icon                   /* Subfolder icon */
.subfolder__name                   /* Subfolder name */
.subfolder__count                  /* File count */
.subfolder__content                /* Subfolder content area */
.subfolder__files                  /* File list container */

.file-item                         /* Individual file item */
.file-item__icon                   /* File type icon */
.file-item__info                   /* File info container */
.file-item__name                   /* File name */
.file-item__size                   /* File size */
```

---

## FileViewer Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `file` | `Object` | No | - | File object to display |
| `file.id` | `string` | No | - | Unique file identifier |
| `file.name` | `string` | Yes | - | File name with extension |
| `file.url` | `string` | No | - | Download URL |
| `file.size` | `number` | No | - | File size in bytes |
| `file.type` | `string` | No | - | MIME type |
| `file.uploadedAt` | `Timestamp/Date` | No | - | Upload timestamp |
| `file.createdAt` | `Timestamp/Date` | No | - | Creation timestamp |
| `onClose` | `Function` | No | - | Called when close button clicked: `() => void` |
| `onDelete` | `Function` | No | - | Called when delete button clicked: `() => void` |

### Supported File Types

**Image Preview:**
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`

**PDF Preview:**
- `.pdf` (via iframe)

**Generic Preview:**
- `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`
- `.zip`, `.rar`, `.7z`, `.tar`, `.gz`
- All other file types

### CSS Classes

```css
.file-viewer                       /* Main container */
.file-viewer__empty                /* Empty state */

.file-viewer__header               /* Header section */
.file-viewer__title                /* Title container */
.file-viewer__icon                 /* File type icon */
.file-viewer__close                /* Close button */

.file-viewer__metadata             /* Metadata section */
.file-viewer__meta-item            /* Individual metadata item */
.file-viewer__meta-label           /* Metadata label */
.file-viewer__meta-value           /* Metadata value */

.file-viewer__preview              /* Preview container */
.file-viewer__preview--image       /* Image preview variant */
.file-viewer__preview--pdf         /* PDF preview variant */
.file-viewer__preview--generic     /* Generic preview variant */

.file-viewer__image                /* Image element */
.file-viewer__pdf                  /* PDF iframe */
.file-viewer__pdf-note             /* PDF fallback note */

.file-viewer__icon-large           /* Large icon for generic */
.file-viewer__type-label           /* File type label */
.file-viewer__preview-note         /* Preview note text */

.file-viewer__actions              /* Actions section */
.file-viewer__btn                  /* Base button class */
.file-viewer__btn--download        /* Download button */
.file-viewer__btn--delete          /* Delete button */
```

---

## FileDropZone Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onUpload` | `Function` | Yes | - | Called when file uploaded: `(file) => Promise` |
| `accept` | `string` | No | `"*/*"` | Accepted file types (HTML input accept format) |
| `maxSize` | `number` | No | `10485760` | Max file size in bytes (10MB default) |
| `disabled` | `boolean` | No | `false` | Whether drop zone is disabled |

### Accept String Examples

```javascript
accept="*/*"                        // All files
accept="image/*"                    // All images
accept=".pdf"                       // PDF only
accept=".pdf,.doc,.docx"            // PDF and Word docs
accept="image/*,.pdf"               // Images and PDF
accept=".jpg,.jpeg,.png,.gif"       // Specific image types
```

### CSS Classes

```css
.file-drop-zone                    /* Main container */
.file-drop-zone--dragging          /* State: dragging over */
.file-drop-zone--disabled          /* State: disabled */
.file-drop-zone--uploading         /* State: uploading */

.file-drop-zone__input             /* Hidden file input */
.file-drop-zone__content           /* Content container */

.file-drop-zone__icon              /* Upload icon */
.file-drop-zone__text              /* Main text */
.file-drop-zone__hint              /* Hint text */

.file-drop-zone__uploading         /* Upload state container */
.file-drop-zone__spinner           /* Loading spinner */
.file-drop-zone__progress-bar      /* Progress bar container */
.file-drop-zone__progress-fill     /* Progress bar fill */
.file-drop-zone__progress-text     /* Progress percentage */

.file-drop-zone__error             /* Error message */
```

---

## FileSystemManager Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `propertyId` | `string` | Yes | - | Property identifier |
| `onClose` | `Function` | Yes | - | Called when manager closed: `() => void` |

### CSS Classes

```css
.file-system-manager               /* Main container */
.file-system-manager__overlay      /* Background overlay */
.file-system-manager__container    /* Content container */

.file-system-manager__header       /* Header section */
.file-system-manager__close        /* Close button */

.file-system-manager__content      /* Main content area */
.file-system-manager__tree         /* Folder tree section */
.file-system-manager__viewer       /* File viewer section */
.file-system-manager__empty        /* Empty state */

.folder-tree                       /* Folder tree container */
```

---

## File Object Structure

Standard file object used across all components:

```typescript
interface FileObject {
  id: string;              // Unique identifier
  name: string;            // File name with extension
  url?: string;            // Download URL
  size?: number;           // File size in bytes
  type?: string;           // MIME type
  sectionId?: string;      // Section identifier
  subfolderId?: string;    // Subfolder identifier
  storagePath?: string;    // Storage path
  uploadedAt?: Timestamp;  // Upload timestamp
  createdAt?: Timestamp;   // Creation timestamp
}
```

---

## Section Object Structure

Standard section object used by FolderSection:

```typescript
interface SectionObject {
  id: string;              // Unique identifier
  label: string;           // Display name
  subfolders: Array<{
    id: string;            // Subfolder identifier
    label: string;         // Subfolder display name
  }>;
}
```

---

## Events and Callbacks

### onFileUpload
```javascript
/**
 * Called when a file is uploaded
 * @param {string} sectionId - Section identifier
 * @param {string} subfolderId - Subfolder identifier
 * @param {File} file - The uploaded File object
 * @returns {Promise} Should return a promise
 */
const onFileUpload = async (sectionId, subfolderId, file) => {
  // Upload logic here
  console.log('Upload:', { sectionId, subfolderId, file });
};
```

### onFileSelect
```javascript
/**
 * Called when a file is selected
 * @param {Object} file - The file object
 */
const onFileSelect = (file) => {
  console.log('Selected:', file);
  setSelectedFile(file);
};
```

### onToggle
```javascript
/**
 * Called when section is toggled
 */
const onToggle = () => {
  setExpanded(!expanded);
};
```

### onDelete
```javascript
/**
 * Called when delete button is clicked
 */
const onDelete = async () => {
  if (confirm('Delete this file?')) {
    // Delete logic here
    console.log('Deleting file');
  }
};
```

### onClose
```javascript
/**
 * Called when close button is clicked
 */
const onClose = () => {
  console.log('Closing viewer');
  setSelectedFile(null);
};
```

---

## CSS Variables

All components use CSS custom properties for theming:

```css
/* Background Colors */
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--bg-light: #f8f9fa;
--bg-hover: #e9ecef;
--bg-active: #e3f2fd;
--bg-disabled: #e9ecef;
--bg-dark: #343a40;
--bg-warning: #fff3cd;
--bg-success-light: #d4edda;
--bg-danger-light: #f8d7da;

/* Text Colors */
--text-primary: #212529;
--text-secondary: #6c757d;

/* Border Colors */
--border-color: #dee2e6;
--border-light: #e9ecef;
--border-warning: #ffc107;
--border-danger: #f5c6cb;

/* Theme Colors */
--primary-color: #2196f3;
--primary-light: #64b5f6;
--primary-dark: #1976d2;
--success-color: #28a745;
--danger-color: #dc3545;
--danger-dark: #c82333;
```

---

## Utility Functions

### Format File Size
```javascript
const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Usage
formatFileSize(1024);        // "1.00 KB"
formatFileSize(1048576);     // "1.00 MB"
formatFileSize(5242880);     // "5.00 MB"
```

### Format Date
```javascript
const formatDate = (timestamp) => {
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
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

// Usage
formatDate(new Date());                    // "Nov 8, 2024, 05:09 PM"
formatDate(firestoreTimestamp);            // "Nov 8, 2024, 05:09 PM"
```

### Get File Type
```javascript
const getFileType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();

  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const documentTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];

  if (ext === 'pdf') return 'pdf';
  if (imageTypes.includes(ext)) return 'image';
  if (documentTypes.includes(ext)) return 'document';
  if (archiveTypes.includes(ext)) return 'archive';

  return 'other';
};

// Usage
getFileType('photo.jpg');     // "image"
getFileType('contract.pdf');  // "pdf"
getFileType('data.xlsx');     // "document"
```

---

## Common Patterns

### Manage Expanded State
```javascript
// Single section
const [expanded, setExpanded] = useState(false);

// Multiple sections
const [expandedSections, setExpandedSections] = useState({});

const toggleSection = (sectionId) => {
  setExpandedSections(prev => ({
    ...prev,
    [sectionId]: !prev[sectionId]
  }));
};
```

### Handle Errors
```javascript
const handleUpload = async (file) => {
  try {
    await uploadFile(file);
  } catch (error) {
    console.error('Upload failed:', error);
    // Show error to user
    alert(`Upload failed: ${error.message}`);
  }
};
```

### Filter Files
```javascript
// By section
const sectionFiles = files.filter(f => f.sectionId === sectionId);

// By subfolder
const subfolderFiles = files.filter(
  f => f.sectionId === sectionId && f.subfolderId === subfolderId
);

// By search term
const searchResults = files.filter(
  f => f.name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Drag & Drop | ✓ | ✓ | ✓ | ✓ |
| File Input | ✓ | ✓ | ✓ | ✓ |
| PDF Preview | ✓ | ✓ | ✓ | ✓ |
| Image Preview | ✓ | ✓ | ✓ | ✓ |
| CSS Grid | ✓ | ✓ | ✓ | ✓ |
| CSS Variables | ✓ | ✓ | ✓ | ✓ |

---

## Performance Tips

1. **Lazy Load**: Only load files when sections are expanded
2. **Virtual Scrolling**: Use for large file lists (100+ files)
3. **Image Optimization**: Serve optimized thumbnails
4. **Debounce Search**: Debounce search input for better performance
5. **Memoization**: Use `useMemo` for expensive calculations
6. **Code Splitting**: Lazy load FileViewer component
7. **Pagination**: Implement pagination for large file lists

---

## Accessibility Checklist

- [ ] All buttons have `aria-label` or text content
- [ ] Images have `alt` text
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader tested
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Loading states are announced
