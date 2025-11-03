import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  getIncomeStatement,
  saveIncomeStatement,
} from "@/services/firestore/incomeStatementService.js";
import { recalcMetrics } from "@/utils/income";
import { toMonthly, toAnnual, isNum } from "@/utils/income/mathUtils"; // optional helper split
import { getNodeAtPath, setNodeAtPath } from "@/utils/income/pathUtils"; // we'll add next
import toast from "react-hot-toast";

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
    setData((prev) => {
      const next = structuredClone(prev);
      const node = getNodeAtPath(next, fullPath) || {};
      const n = raw === "" ? "" : Number(raw);

      node[field] = n;

      // Monthly↔Annual mirror
      if (field.endsWith("Monthly")) {
        if (field === "rateMonthly" && isNum(n)) node.rateAnnual = toAnnual(n);
        if (field === "grossMonthly" && isNum(n))
          node.grossAnnual = toAnnual(n);
      } else if (field.endsWith("Annual")) {
        if (field === "grossAnnual" && isNum(n))
          node.grossMonthly = toMonthly(n);
      }

      setNodeAtPath(next, fullPath, node);
      return next;
    });
    setDirty(true);
  }, []);

  // ────────────────────────────────────────────────

  /* --------------------------------- Save --------------------------------- */
  const save = useCallback(
    async (customData) => {
      try {
        await saveIncomeStatement(userId, propertyId, customData || data);
        setDirty(false);
        toast.success("💾 Auto-saved");
      } catch (err) {
        console.error("Save failed:", err);
        toast.error("❌ Auto-save failed");
      }
    },
    [userId, propertyId, data]
  );

  /* -------------------------------- Add ---------------------------------- */
  const addItem = useCallback(
    async (path, label) => {
      if (!path) return;
      let updated;
      setData((prev) => {
        updated = structuredClone(prev);
        const keys = path.split(".");
        let cur = updated;
        for (const k of keys) cur = cur[k] ||= {};
        let unique = label;
        let i = 2;
        while (cur[unique]) unique = `${label} ${i++}`;
        cur[unique] = {
          rateAnnual: 0,
          grossAnnual: 0,
          psfAnnual: 0,
          punitAnnual: 0,
          rateMonthly: 0,
          grossMonthly: 0,
          psfMonthly: 0,
          punitMonthly: 0,
        };
        return updated;
      });

      // ✅ Save immediately after updating
      await save(updated);
    },
    [save]
  );

  /* -------------------------------- Delete -------------------------------- */
  const deleteItem = useCallback(
    async (path) => {
      let updated;
      setData((prev) => {
        updated = structuredClone(prev);
        const keys = path.split(".");
        let cur = updated;
        for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
        delete cur[keys.at(-1)];
        return updated;
      });

      // ✅ Save immediately after updating
      await save(updated);
    },
    [save]
  );



  const value = {
    data,
    setData,
    loading,
    dirty,
    updateField,
    addItem,
    deleteItem,
    save,
  };

  return (
    <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>
  );
}

export const useIncome = () => {
  const ctx = useContext(IncomeContext);
  if (!ctx) throw new Error("useIncome must be used within <IncomeProvider>");
  return ctx;
};
