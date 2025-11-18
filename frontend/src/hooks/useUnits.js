import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import { saveUnits } from "@/services/firestore/unitsService";
import { defaultUnits } from "@/utils/units/unitsDefaults";

/**
 * Hook to manage units data with real-time updates
 */
export function useUnits(userId, propertyId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener
  useEffect(() => {
    if (!userId || !propertyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');

    const unsubscribe = onSnapshot(
      unitsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data());
        } else {
          setData(defaultUnits());
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error listening to units:", err);
        setError(err);
        setData(defaultUnits());
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
