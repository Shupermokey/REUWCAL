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

  // 🧩 Fetch
  useEffect(() => {
    if (!uid || !propertyId) return;

    setLoading(true);

    getIncomeStatement(uid, propertyId)
      .then((fetched) => {
        setData(fetched || {});
      })
      .catch((err) => console.error("Failed to load income statement:", err))
      .finally(() => setLoading(false));
  }, [uid, propertyId]);

  /** Save changes back to Firestore */
  // 💾 Save
  const save = useCallback(async () => {
    if (!uid || !propertyId) return;
    await saveIncomeStatement(uid, propertyId, data);
  }, [uid, propertyId, data]);


  return { data, setData, save, loading };
}
