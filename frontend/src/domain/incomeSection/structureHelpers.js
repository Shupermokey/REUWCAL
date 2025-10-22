// src/domain/incomeSection/structureHelpers.js
import { LEAF_KEYS } from "@constants/incomeKeys.js";

/** Checks if value is a plain object */
export const isPO = (v) =>
  v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

/** Checks if node is a leaf node (contains numeric income fields) */
export const isLeafNode = (v) =>
  isPO(v) && LEAF_KEYS.some((k) => k in v && typeof v[k] !== "object");

/** Returns parent path of 'a.b.c' → 'a.b' */
export const parentPath = (full) =>
  full.includes(".") ? full.split(".").slice(0, -1).join(".") : "";

/** Returns the last segment of a path ('a.b.c' → 'c') */
export const leafKey = (full) => full.split(".").pop();

/** Returns CSS grid class for a given nesting depth */
export const getRowClass = (depth) =>
  depth > 0 ? "sec__subRowGrid" : "sec__rowGrid";
