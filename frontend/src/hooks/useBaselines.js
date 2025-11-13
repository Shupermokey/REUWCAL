// src/hooks/useBaselines.js
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { getBaselines, onBaselinesSnapshot } from "@/services/firestore/baselinesService";

/**
 * Hook to fetch the current user's baselines.
 * @param {boolean} realtime - Enable Firestore snapshot listener
 * @returns {object} { baselines, loading, error }
 */
export const useBaselines = (realtime = false) => {
  const { user } = useAuth();
  const [baselines, setBaselines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setBaselines([]);
      setLoading(false);
      return;
    }

    let unsubscribe;
    if (realtime) {
      unsubscribe = onBaselinesSnapshot(user.uid, (data) => {
        setBaselines(data);
        setLoading(false);
      });
    } else {
      (async () => {
        try {
          const data = await getBaselines(user.uid);
          setBaselines(data);
        } catch (err) {
          console.error("❌ Error fetching baselines:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      })();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, realtime]);

  return { baselines, loading, error };
};
