import { LEAF_KEYS } from "./incomeDefaults.js";
import { isLeaf } from "./incomeMath.js";

const hasAnyLeafKeys = (o) => LEAF_KEYS.some((k) => k in (o || {}));
const pickLeaf = (o) => LEAF_KEYS.reduce((acc,k)=> (acc[k]=Number(o?.[k]||0), acc), {});

export const deepMerge = (base, incoming) => {
  if (!incoming) return structuredClone(base);
  if (isLeaf(incoming)) return { ...incoming };
  const out = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    const bv = base?.[k];
    out[k] =
      bv && typeof bv === "object" && !isLeaf(bv) &&
      typeof v === "object" && !isLeaf(v)
        ? deepMerge(bv, v)
        : isLeaf(v) ? { ...v } : { ...(v || {}) };
  }
  return out;
};

export function migrateMixedNodes(node, path = "") {
  if (!node || typeof node !== "object" || isLeaf(node)) return node;
  const keys = Object.keys(node);
  const hasLeaf = hasAnyLeafKeys(node);
  const hasChildren = keys.some((k) => !LEAF_KEYS.includes(k) && typeof node[k] === "object");
  if (hasLeaf && hasChildren) {
    const leaf = pickLeaf(node);
    LEAF_KEYS.forEach((k) => { delete node[k]; });
    if (!node.Default) node.Default = leaf;
  }
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "object") node[k] = migrateMixedNodes(v, path ? `${path}.${k}` : k);
  }
  return node;
}
