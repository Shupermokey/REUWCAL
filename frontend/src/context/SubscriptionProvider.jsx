import React, { createContext, useState, useEffect, useContext } from "react";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [product, setProduct] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        
     }
     catch (error) {
         console.error("Error fetching subscription:", error);
    }
    finally {
          setLoading(false);
        }
  }

    fetchSubscription();
  }, [currentPlan]);

  return (
    <SubscriptionContext.Provider value={{ currentPlan, setCurrentPlan, loading }}>
      {!loading && children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
