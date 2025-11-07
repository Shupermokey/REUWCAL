import { useState, useEffect, useCallback } from "react";
import {
  getGrossBuildingArea,
  saveGrossBuildingArea,
} from "@/services/firestore/grossBuildingService";
import { defaultGrossBuildingArea } from "@/utils/grossBuildingArea/grossBuildingAreaDefaults";

/**
 * Hook to manage gross building area data
 */
export function useGrossBuildingArea(userId, propertyId) {
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
        const grossBuildingAreaData = await getGrossBuildingArea(userId, propertyId);

        if (isMounted) {
          setData(grossBuildingAreaData || defaultGrossBuildingArea());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading gross building area:", err);
        if (isMounted) {
          setError(err);
          setData(defaultGrossBuildingArea());
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
      await saveGrossBuildingArea(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving gross building area:", err);
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
