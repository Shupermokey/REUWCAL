import { useState, useEffect, useCallback } from "react";
import { getUnits, saveUnits } from "@/services/firestore/unitsService";
import { defaultUnits } from "@/utils/units/unitsDefaults";

/**
 * Hook to manage units data
 */
export function useUnits(userId, propertyId) {
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
        const unitsData = await getUnits(userId, propertyId);

        if (isMounted) {
          setData(unitsData || defaultUnits());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading units:", err);
        if (isMounted) {
          setError(err);
          setData(defaultUnits());
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
      await saveUnits(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving units:", err);
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
