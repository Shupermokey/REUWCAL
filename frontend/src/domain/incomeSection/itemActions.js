// src/domain/incomeSection/itemActions.js
import { newLeaf } from "@utils/income/incomeDefaults.js";
import { isLeafNode, isPO } from "./structureHelpers.js";

/** Generic path setter that updates any nested field */
export const setAtPath = ({ path, data, onChange, updater }) => {
  const keys = path ? path.split(".") : [];

  // Root update
  if (keys.length === 0) {
    const next = updater(structuredClone(data));
    onChange(next ?? structuredClone(data));
    return;
  }

  // Nested update
  const updated = structuredClone(data);
  let cur = updated;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] ||= {};
  const k = keys.at(-1);
  const nextVal = updater(cur[k]);
  cur[k] = nextVal;
  onChange(updated);
};

/** Add a new leaf or branch at the specified path */
export const addItem = async ({ path = "", title, data, onChange, prompt }) => {
  const raw = await prompt({
    title: "New line item",
    message: path ? `Parent: ${path}` : `Add to ${title ?? "Section"}`,
    placeholder: "e.g., Landscaping",
  });
  if (raw == null) return;

  const label = String(raw)
    .trim()
    .replace(/[~*/\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "Item";

  const updated = structuredClone(data);
  let cur = updated;
  if (path) path.split(".").forEach((k) => (cur = cur[k] ||= {}));

  let key = label,
    i = 2;
  while (Object.prototype.hasOwnProperty.call(cur, key)) key = `${label} ${i++}`;

  cur[key] = newLeaf();
  onChange(updated);
};

/** Promote a leaf to an object containing subitems */
export const promoteToObject = async ({ path, data, onChange, prompt }) => {
  const raw = await prompt({
    title: "Add a sub-item",
    message: `Parent: ${path}`,
    placeholder: "e.g., Landscaping",
  });
  if (raw == null) return;

  const label = String(raw)
    .trim()
    .replace(/[~*/\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "Subitem";

  const updated = structuredClone(data);
  let cur = updated;
  const keys = path.split(".");
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  const last = keys.at(-1);

  const prev = cur[last];
  const leaf = isLeafNode(prev) ? prev : newLeaf();
  const branch = {};
  let k = label,
    i = 2;
  while (Object.prototype.hasOwnProperty.call(branch, k)) k = `${label} ${i++}`;
  branch[k] = { ...leaf };
  cur[last] = branch;

  onChange(updated);
};

/** Delete any node at a given path */
export const deleteAtPath = async ({ path, data, onChange, confirm }) => {
  const ok = await confirm({
    title: "Delete this item?",
    message: `This will remove "${path}" and its sub-items.`,
  });
  if (!ok) return;

  const keys = path.split(".");
  const updated = structuredClone(data);
  let cur = updated;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  delete cur[keys.at(-1)];
  onChange(updated);
};
