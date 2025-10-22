// src/domain/incomeSection/dragLogic.js
import { isPO } from "./structureHelpers.js";

export const handleDragEnd = ({ active, over, full, handleSetAtPath }) => {
  if (!over || active.id === over.id) return;

  const fromKey = active.id;
  const toKey = over.id;

  // Top-level reorder
  if (full === "") {
    handleSetAtPath("", (prevData) => {
      const keys = Object.keys(prevData);
      const from = keys.indexOf(fromKey);
      const to = keys.indexOf(toKey);
      if (from < 0 || to < 0) return prevData;

      const reordered = {};
      const reorderedKeys = [...keys];
      const [moved] = reorderedKeys.splice(from, 1);
      reorderedKeys.splice(to, 0, moved);
      reorderedKeys.forEach((k) => (reordered[k] = prevData[k]));
      return reordered;
    });
    return;
  }

  // Nested reorder
  handleSetAtPath(full, (prevBranch) => {
    if (!isPO(prevBranch)) return prevBranch;
    const keys = Object.keys(prevBranch);
    const from = keys.indexOf(fromKey);
    const to = keys.indexOf(toKey);
    if (from < 0 || to < 0) return prevBranch;

    const reorderedKeys = [...keys];
    const [moved] = reorderedKeys.splice(from, 1);
    reorderedKeys.splice(to, 0, moved);

    const newBranch = {};
    reorderedKeys.forEach((k) => (newBranch[k] = prevBranch[k]));
    return newBranch;
  });
};
