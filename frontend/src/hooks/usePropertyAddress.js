import { useState, useEffect, useCallback } from "react";
import {
  getPropertyAddress,
  savePropertyAddress,
} from "@/services/firestore/propertyAddressService";
import { defaultPropertyAddress } from "@/utils/propertyAddress/propertyAddressDefaults";

/**
 * Hook to manage property address data
 */
export function usePropertyAddress(userId, propertyId) {
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
        const propertyAddressData = await getPropertyAddress(userId, propertyId);

        if (isMounted) {
          setData(propertyAddressData || defaultPropertyAddress());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading property address:", err);
        if (isMounted) {
          setError(err);
          setData(defaultPropertyAddress());
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
      await savePropertyAddress(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving property address:", err);
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
