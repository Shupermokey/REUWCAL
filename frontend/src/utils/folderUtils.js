// Converts an array of folder IDs to a Firestore-style nested path
// Example: ['abc123', 'def456'] ➜ 'folders/abc123/folders/def456'

export const getFolderPath = (pathArray) => {
    if (!Array.isArray(pathArray)) return '';
    return pathArray.map((id) => `folders/${id}`).join('/');
  };

  