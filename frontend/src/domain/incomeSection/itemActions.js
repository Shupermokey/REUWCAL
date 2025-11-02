import { newLeaf } from "@utils/income/incomeDefaults.js";
import { isLeafNode, isPO } from "./structureHelpers.js";

/* -------------------------------------------------------------------------- */
/* 🔒 Safe setAtPath – prevents recursive Income nesting                      */
/* -------------------------------------------------------------------------- */
export const setAtPath = ({ path, data, onChange, updater }) => {
  const keys = path.split(".");
  const updated = structuredClone(data);
  let cur = updated;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof cur[k] !== "object" || cur[k] == null) cur[k] = {};
    cur = cur[k];
  }
  cur[keys.at(-1)] = updater(cur[keys.at(-1)]);
  if (onChange) onChange(updated);
  return updated;
};

/* -------------------------------------------------------------------------- */
/* ➕ Add new item                                                            */
/* -------------------------------------------------------------------------- */
export const addItem = async ({ path = "", title, data, onChange, prompt }) => {
  const raw = await prompt({
    title: "New line item",
    message: path ? `Parent: ${path}` : `Add to ${title ?? "Section"}`,
    placeholder: "e.g., Landscaping",
  });
  if (raw == null) return;

  const label =
    String(raw)
      .trim()
      .replace(/[~*/\[\]]/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 80) || "Item";

  const updated = structuredClone(data); // create a deep copy of the data object
  let cur = updated;
  if (path) path.split(".").forEach((k) => (cur = cur[k] ||= {}));

  let key = label,
    i = 2;

  while (Object.prototype.hasOwnProperty.call(cur, key))
    key = `${label} ${i++}`;

  cur[key] = newLeaf();
  onChange(updated);
  return updated;
};

/* -------------------------------------------------------------------------- */
/* ⏫ Promote to branch                                                       */
/* -------------------------------------------------------------------------- */
export const promoteToObject = async ({ path, data, onChange, prompt }) => {
  const raw = await prompt({
    title: "Add a sub-item",
    message: `Parent: ${path}`,
    placeholder: "e.g., Landscaping",
  });
  if (raw == null) return;

  const label =
    String(raw)
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

/* -------------------------------------------------------------------------- */
/* ❌ Delete                                                                 */
/* -------------------------------------------------------------------------- */
export const deleteAtPath = async ({ path, data, onChange, confirm }) => {
  const ok = await confirm({
    title: "Delete this item?",
    message: `This will remove "${path}" and its sub-items.`,
  });
  if (!ok) return;
  const keys = path.split("."); // e.g. ["Income", "New"]
  const updated = structuredClone(data);
  let cur = updated;

  // 🩹 If the top-level key doesn't exist, assume path is relative
  if (!cur[keys[0]] && keys.length > 1) {
    console.warn(
      `deleteAtPath: Top-level "${keys[0]}" not found, using relative path`
    );
    keys.shift();
  }

  // walk to parent object
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) {
      console.warn(`deleteAtPath: Invalid path "${path}"`);
      return;
    }
    cur = cur[keys[i]];
  }

  // delete the key
  delete cur[keys.at(-1)];

  onChange(updated);
  return updated;
};
