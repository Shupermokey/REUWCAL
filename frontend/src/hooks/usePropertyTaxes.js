import { useState, useEffect, useCallback } from "react";
import {
  getPropertyTaxes,
  savePropertyTaxes,
} from "@/services/firestore/propertyTaxesService";
import { defaultPropertyTaxes } from "@/utils/propertyTaxes/propertyTaxesDefaults";

/**
 * Hook to manage property taxes data
 */
export function usePropertyTaxes(userId, propertyId) {
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
        const propertyTaxesData = await getPropertyTaxes(userId, propertyId);

        if (isMounted) {
          setData(propertyTaxesData || defaultPropertyTaxes());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading property taxes:", err);
        if (isMounted) {
          setError(err);
          setData(defaultPropertyTaxes());
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
      await savePropertyTaxes(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving property taxes:", err);
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
