# FileSystem Components - Setup Guide

## Installation & Setup

### 1. Install PropTypes (Required)

The components use PropTypes for prop validation. Install it:

```bash
npm install prop-types
```

Or with yarn:

```bash
yarn add prop-types
```

### 2. Verify File Structure

Ensure all files are in place:

```
frontend/src/
├── components/FileSystem/
│   ├── FolderSection.jsx       ✓
│   ├── FileViewer.jsx          ✓
│   ├── FileDropZone.jsx        ✓
│   ├── FileSystemManager.jsx   ✓ (existing)
│   └── [Documentation files]
│
└── styles/components/FileSystem/
    ├── FolderSection.css       ✓
    ├── FileViewer.css          ✓
    ├── FileDropZone.css        ✓
    └── FileSystemManager.css   ✓
```

### 3. Check Dependencies

Required dependencies (already installed):
- ✅ React (^18.3.1)
- ✅ React DOM (^18.3.1)
- ⚠️ PropTypes (needs to be installed)

### 4. Verify Path Aliases

Make sure your `vite.config.js` has the `@` alias configured:

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ... other aliases
    }
  }
});
```

This is already configured in your project ✓

---

## Quick Test

### Test 1: Import Components

Create a test file to verify imports work:

```jsx
// Test.jsx
import FolderSection from '@/components/FileSystem/FolderSection';
import FileViewer from '@/components/FileSystem/FileViewer';
import FileDropZone from '@/components/FileSystem/FileDropZone';

function Test() {
  console.log('Components imported successfully!');
  return <div>Test</div>;
}

export default Test;
```

### Test 2: Basic FileDropZone

```jsx
import FileDropZone from '@/components/FileSystem/FileDropZone';

function TestUpload() {
  const handleUpload = async (file) => {
    console.log('Uploaded:', file.name);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <FileDropZone onUpload={handleUpload} />
    </div>
  );
}
```

### Test 3: Basic FileViewer

```jsx
import FileViewer from '@/components/FileSystem/FileViewer';

function TestViewer() {
  const testFile = {
    name: 'test-document.pdf',
    size: 1024000,
    type: 'application/pdf',
    url: 'https://example.com/sample.pdf',
    uploadedAt: new Date()
  };

  return (
    <div style={{ height: '500px' }}>
      <FileViewer file={testFile} />
    </div>
  );
}
```

---

## Integration Checklist

- [ ] Install `prop-types` package
- [ ] Verify `@` path alias works
- [ ] Import a component in your code
- [ ] Render a simple component
- [ ] Check browser console for errors
- [ ] Verify styles are loading
- [ ] Test on different browsers
- [ ] Test responsive behavior

---

## Troubleshooting Setup

### Issue: "Cannot find module 'prop-types'"

**Solution**:
```bash
npm install prop-types
```

### Issue: "Cannot find module '@/components/FileSystem/...'"

**Solution**:
- Check that `vite.config.js` has the `@` alias
- Restart the dev server after config changes
- Verify file paths are correct

### Issue: Styles not loading

**Solution**:
- Check that CSS files exist in the correct location
- Verify CSS imports in components use `@/styles/...`
- Clear browser cache
- Restart dev server

### Issue: "PropTypes is not defined"

**Solution**:
Make sure PropTypes is imported at the top of each component:
```jsx
import PropTypes from "prop-types";
```

---

## Optional: Remove PropTypes (Not Recommended)

If you don't want to use PropTypes, you can remove the PropTypes code from each component:

1. Remove the import:
```jsx
import PropTypes from "prop-types";  // DELETE THIS LINE
```

2. Remove the PropTypes definition at the end:
```jsx
ComponentName.propTypes = {  // DELETE THIS ENTIRE BLOCK
  // ...
};
```

**Note**: PropTypes provide helpful development warnings and documentation. It's recommended to keep them.

---

## Environment Setup

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Running Tests

```bash
npm test
```

---

## Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## File Sizes

Total package size:
- **Components**: ~25KB (uncompressed)
- **Styles**: ~17KB (uncompressed)
- **Documentation**: ~50KB

Gzipped:
- **Components**: ~6KB
- **Styles**: ~3KB

---

## Performance Considerations

1. **Code Splitting**: Components can be lazy loaded:
```jsx
const FileViewer = lazy(() => import('@/components/FileSystem/FileViewer'));
```

2. **CSS Variables**: Used for theming (no runtime overhead)

3. **No External Dependencies**: Components only depend on React and PropTypes

---

## Next Steps

1. ✅ Install PropTypes
2. ✅ Test basic import
3. ✅ Review documentation
4. ✅ Integrate into your app
5. ✅ Customize styling
6. ✅ Deploy to production

---

## Support

If you encounter any issues:

1. Check this SETUP.md file
2. Review the README.md for component usage
3. Check USAGE_EXAMPLES.md for code samples
4. Review browser console for errors
5. Verify all dependencies are installed

---

## Complete Installation Script

Run this to set up everything at once:

```bash
# Install dependencies
npm install prop-types

# Verify installation
npm list prop-types

# Start dev server
npm run dev
```

---

**Setup complete! You're ready to use the FileSystem components.**
