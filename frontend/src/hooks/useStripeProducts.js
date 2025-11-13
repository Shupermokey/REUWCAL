import { useEffect, useState } from "react";
import { getStripeProducts, onStripeProductsSnapshot } from "@/services/firestore/stripeProductsService";

/**
 * Hook to fetch active Stripe products.
 * @param {boolean} realtime - Enable Firestore snapshot listener
 * @returns {object} { products, loading, error }
 */
export const useStripeProducts = (realtime = false) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    if (realtime) {
      unsubscribe = onStripeProductsSnapshot((data) => {
        setProducts(data);
        setLoading(false);
      });
    } else {
      (async () => {
        try {
          const data = await getStripeProducts();
          setProducts(data);
        } catch (err) {
          console.error("❌ Error fetching Stripe products:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      })();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [realtime]);

  return { products, loading, error };
};
