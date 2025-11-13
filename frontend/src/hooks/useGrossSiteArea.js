import { useState, useEffect, useCallback } from "react";
import {
  getGrossSiteArea,
  saveGrossSiteArea,
} from "@/services/firestore/grossSiteAreaService";
import { defaultGrossSiteArea } from "@/utils/grossSiteArea/grossSiteAreaDefaults";

/**
 * Hook to manage gross site area data
 */
export function useGrossSiteArea(userId, propertyId) {
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
        const grossSiteAreaData = await getGrossSiteArea(userId, propertyId);

        if (isMounted) {
          setData(grossSiteAreaData || defaultGrossSiteArea());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading gross site area:", err);
        if (isMounted) {
          setError(err);
          setData(defaultGrossSiteArea());
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
      await saveGrossSiteArea(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving gross site area:", err);
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
