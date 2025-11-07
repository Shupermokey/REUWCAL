import { useState, useEffect, useCallback } from "react";
import { getFinancing, saveFinancing } from "@/services/firestore/financingService";
import { defaultFinancing } from "@/utils/financing/financingDefaults";

/**
 * Hook to manage financing data
 */
export function useFinancing(userId, propertyId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data
  useEffect(() => {
    if (!userId || !propertyId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const financingData = await getFinancing(userId, propertyId);

        if (isMounted) {
          setData(financingData || defaultFinancing());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading financing:", err);
        if (isMounted) {
          setError(err);
          setData(defaultFinancing());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId, propertyId]);

  // Save data
  const save = useCallback(async () => {
    if (!userId || !propertyId || !data) {
      throw new Error("Missing required data for save");
    }

    try {
      await saveFinancing(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving financing:", err);
      throw err;
    }
  }, [userId, propertyId, data]);

  return {
    data,
    setData,
    loading,
    error,
    save,
  };
}
