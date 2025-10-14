// src/mappers/firestoreMappers.js

/** Generic utilities */
export const mapDoc = (snap) =>
  snap.exists() ? { id: snap.id, ...snap.data() } : null;

export const mapCollection = (snapshot) =>
  snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

/* ──────────────────────────────────────────────
   🧩 SECTION-SPECIFIC MAPPERS
─────────────────────────────────────────────── */

/** Normalize income statement data */
export const mapIncomeStatement = (data = {}) => ({
  Income: data.Income || {},
  Expenses: data.Expenses || {},
  CashFlow: data.CashFlow || {},
});

/** Normalize property taxes */
export const mapPropertyTaxes = (data = {}) => ({
  pins: data.pins || [],
  totalAmount: data.totalAmount || 0,
  breakdown: data.breakdown || {},
});

/** Normalize gross site area */
export const mapGrossSiteArea = (data = {}) => ({
  acres: data.acres || 0,
  squareFeet: data.squareFeet || 0,
  documents: data.documents || [],
});

/** Normalize gross building area */
export const mapGrossBuildingArea = (data = {}) => ({
  gba: data.gba || 0,
  gla: data.gla || 0,
  nra: data.nra || 0,
  documents: data.documents || [],
});

/** Normalize purchase price */
export const mapPurchasePrice = (data = {}) => ({
  contractPrice: data.contractPrice || 0,
  dueDiligence: data.dueDiligence || 0,
  capitalReserve: data.capitalReserve || 0,
  total: data.total || 0,
});

/** Normalize financing */
export const mapFinancing = (data = {}) => ({
  loanAmount: data.loanAmount || 0,
  interestRate: data.interestRate || 0,
  termYears: data.termYears || 0,
  amortization: data.amortization || 0,
});

/** Normalize property */
export const mapProperty = (data = {}) => ({
  id: data.id || "",
  name: data.name || "",
  address: data.address || "",
  zoningCategory: data.zoningCategory || "",
  zoningSubtype: data.zoningSubtype || "",
  createdAt: data.createdAt || null,
  updatedAt: data.updatedAt || null,
});
