import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getIncomeStatement, saveIncomeStatement } from "@/services/firestore/incomeStatementService.js";
import { recalcMetrics } from "@/utils/income";
import { toMonthly, toAnnual, isNum } from "@/utils/income/mathUtils"; // optional helper split
import { getNodeAtPath, setNodeAtPath } from "@/utils/income/pathUtils"; // we'll add next

const IncomeContext = createContext(null);

export function IncomeProvider({ userId, propertyId, children }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  // ────────────────────────────────────────────────
  // 🔹 Load from Firestore
  useEffect(() => {
    if (!userId || !propertyId) return;
    (async () => {
      setLoading(true);
      const snapshot = await getIncomeStatement(userId, propertyId);
      setData(snapshot || {});
      setLoading(false);
    })();
  }, [userId, propertyId]);

  // ────────────────────────────────────────────────
  // 🔹 Core field updater (the new “handleChange”)
  const updateField = useCallback((fullPath, field, raw, metrics = {}) => {
    setData(prev => {
      const next = structuredClone(prev);
      const node = getNodeAtPath(next, fullPath) || {};
      const n = raw === "" ? "" : Number(raw);

      node[field] = n;

      // Monthly↔Annual mirror
      if (field.endsWith("Monthly")) {
        if (field === "rateMonthly" && isNum(n)) node.rateAnnual = toAnnual(n);
        if (field === "grossMonthly" && isNum(n)) node.grossAnnual = toAnnual(n);
      } else if (field.endsWith("Annual")) {
        if (field === "grossAnnual" && isNum(n)) node.grossMonthly = toMonthly(n);
      }

      setNodeAtPath(next, fullPath, node);
      return next;
    });
    setDirty(true);
  }, []);

  // ────────────────────────────────────────────────
  // 🔹 Add / Delete rows (simplified)
  const addItem = useCallback((path, label = "New Item") => {
    setData(prev => {
      const next = structuredClone(prev);
      const branch = getNodeAtPath(next, path) || {};
      branch[label] = {
        rateMonthly: 0, grossMonthly: 0, psfMonthly: 0, punitMonthly: 0,
        rateAnnual: 0, grossAnnual: 0, psfAnnual: 0, punitAnnual: 0,
      };
      setNodeAtPath(next, path, branch);
      return next;
    });
    setDirty(true);
  }, []);

  const deleteItem = useCallback((path) => {
    setData(prev => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      const last = keys.pop();
      const parent = getNodeAtPath(next, keys.join("."));
      if (parent && parent[last]) delete parent[last];
      return next;
    });
    setDirty(true);
  }, []);

  // ────────────────────────────────────────────────
  // 🔹 Save to Firestore
  const save = useCallback(async () => {
    if (!userId || !propertyId) return;
    await saveIncomeStatement(userId, propertyId, data);
    setDirty(false);
  }, [userId, propertyId, data]);

  const value = {
    data,
    loading,
    dirty,
    updateField,
    addItem,
    deleteItem,
    save,
  };

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
}

export const useIncome = () => {
  const ctx = useContext(IncomeContext);
  if (!ctx) throw new Error("useIncome must be used within <IncomeProvider>");
  return ctx;
};
