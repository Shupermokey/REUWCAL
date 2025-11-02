import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getIncomeStatement,
  saveIncomeStatement,
} from "@/services/firestore/incomeStatementService.js";

/**
 * Provides a full CRUD interface for an income statement.
 * Handles fetching, local edits, and auto-saving to Firestore.
 */
export function useIncomeStatement(uid, propertyId) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !propertyId) return;
    let mounted = true;

    (async () => {
      try {
        const result = await getIncomeStatement(uid, propertyId); //{"Income":{...},"OperatingExpenses":{...},"CapitalExpenses":{...}}
        if (mounted) setData(result || {});
      } catch (err) {
        toast.error("Failed to load Income Statement");
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [uid, propertyId]);

  /** Save changes back to Firestore */
  const save = useCallback(
    async (updates) => {
      if (!uid || !propertyId) return;
      try {
        await saveIncomeStatement(uid, propertyId, updates);
        setData(updates);
        toast.success("💾 Saved Income Statement");
      } catch (err) {
        console.error("Failed to save:", err);
        toast.error("❌ Save failed");
      }
    },
    [uid, propertyId]
  );

  /** Convenience: apply a mutation function to the current data */
  const update = useCallback(
    async (mutator) => {
      const updated = mutator(structuredClone(data));
      setData(updated);
      await save(updated);
    },
    [data, save]
  );

  return { data, setData, save, update, loading };
}
