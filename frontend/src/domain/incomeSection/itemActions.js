import { newLeaf } from "@utils/income/incomeDefaults.js";
import { isLeafNode, isPO } from "./structureHelpers.js";

/* -------------------------------------------------------------------------- */
/* 🔒 Safe setAtPath – prevents recursive Income nesting                      */
/* -------------------------------------------------------------------------- */
export const setAtPath = ({ path, data, onChange, updater }) => {
  if (!path || !onChange || typeof updater !== "function") return;

  // 🧹 Normalize duplicate section prefixes
  path = path.replace(
    /^((Income|OperatingExpenses|CapitalExpenses))\.\1\./,
    "$1."
  );

  // 🚫 Guard against recursive or root-level rewrites
  if (path === "Income.Income" || path === "Income") {
    console.warn("itemActions.js [setAtPath] Ignored unsafe recursive path:", path);
    return;
  }

  const keys = path.split(".");
  const updated = structuredClone(data || {});
  let cur = updated;

  // 🧱 Guard: avoid re-wrapping section roots
  const rootKey = keys[0];
  if (["Income", "OperatingExpenses", "CapitalExpenses"].includes(rootKey) && updated[rootKey]) {
    cur = updated[rootKey];
    keys.shift(); // drop redundant root key for traversal
    console.log("itemActions.js [setAtPath] Adjusted root path to avoid nesting:", keys.join("."));
  }

  // Traverse into nested structure
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof cur[key] !== "object" || cur[key] == null) cur[key] = {};
    cur = cur[key];
  }
  console.log("itemActions.js [setAtPath] Final target key:", keys.at(-1));

  const last = keys.at(-1);
  const prevVal = cur[last];
  const nextVal = updater(prevVal);

  if (JSON.stringify(prevVal) === JSON.stringify(nextVal)) return;
  cur[last] = nextVal;

  onChange(updated);
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

/* -------------------------------------------------------------------------- */
/* ❌ Delete                                                                 */
/* -------------------------------------------------------------------------- */
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
