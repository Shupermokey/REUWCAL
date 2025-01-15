import React, { createContext, useState, useEffect, useContext } from 'react';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const [tier, setTier] = useState('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const response = await fetch('/api/subscription');
                const data = await response.json();
                setTier(data.tier);
            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, []);

    return (
        <SubscriptionContext.Provider value={{ tier, loading }}>
            {!loading && children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);
