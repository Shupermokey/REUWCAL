import { useState, useEffect, useCallback } from "react";
import { getPurchasePrice, savePurchasePrice } from "@/services/firestore/purchasePriceService";
import { defaultPurchasePrice } from "@/utils/purchasePrice/purchasePriceDefaults";

/**
 * Hook to manage purchase price data
 */
export function usePurchasePrice(userId, propertyId) {
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
        const purchasePriceData = await getPurchasePrice(userId, propertyId);

        if (isMounted) {
          setData(purchasePriceData || defaultPurchasePrice());
          setError(null);
        }
      } catch (err) {
        console.error("Error loading purchase price:", err);
        if (isMounted) {
          setError(err);
          setData(defaultPurchasePrice());
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
      await savePurchasePrice(userId, propertyId, data);
      return true;
    } catch (err) {
      console.error("Error saving purchase price:", err);
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
