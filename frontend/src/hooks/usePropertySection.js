// src/hooks/usePropertySection.js
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Generic hook for fetching/saving property sections.
 */
export function usePropertySection(uid, propertyId, fetchFn, saveFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !propertyId) return;
    let mounted = true;
    fetchFn(uid, propertyId)
      .then((res) => mounted && setData(res || {}))
      .catch(() => toast.error("Failed to load section"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [uid, propertyId, fetchFn]);

  const save = useCallback(
    async (updates) => {
      if (!uid || !propertyId) return;
      try {
        await saveFn(uid, propertyId, updates);
        toast.success("Saved!");
        setData((prev) => ({ ...prev, ...updates }));
      } catch (e) {
        toast.error("Save failed");
        console.error(e);
      }
    },
    [uid, propertyId, saveFn]
  );

  return { data, save, loading, setData };
}
