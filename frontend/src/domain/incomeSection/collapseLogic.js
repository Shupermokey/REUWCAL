// src/domain/incomeSection/collapseLogic.js
import { isPO, isLeafNode } from "./structureHelpers.js";

export const collapseAll = (data, setCollapsedPaths) => {
  const all = new Set();
  const walk = (obj, p = "") => {
    if (!isPO(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      const path = p ? `${p}.${k}` : k;
      if (isPO(v) && !isLeafNode(v)) {
        all.add(path);
        walk(v, path);
      }
    }
  };
  walk(data);
  setCollapsedPaths(all);
};

export const expandAll = (setCollapsedPaths) => setCollapsedPaths(new Set());

export const togglePath = (path, setCollapsedPaths) =>
  setCollapsedPaths((prev) => {
    const next = new Set(prev);
    next.has(path) ? next.delete(path) : next.add(path);
    return next;
  });
