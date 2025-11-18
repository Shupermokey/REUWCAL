import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig'; 
import { useAuth } from './AuthProvider'; 
import { resolveTierFromSubscriptions, TIERS } from '../../constants/tiers';


const Ctx = createContext({
  tier: TIERS.Free,
  isLoading: true,
  subscriptions: [],
  source: 'none', // 'stripe' | 'userDoc' | 'none'
});

export const useSubscription = () => useContext(Ctx);

/**
 * Reads active Stripe subscriptions for the current user:
 * customers/{uid}/subscriptions WHERE status IN ['trialing','active']
 * Falls back to users/{uid}.tier if present.
 */
export default function SubscriptionProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState({ tier: TIERS.Free, isLoading: true, subscriptions: [], source: 'none' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ tier: TIERS.Free, isLoading: false, subscriptions: [], source: 'none' });
      return;
    }

    // 1) Listen to Stripe subs
    const subsCol = collection(db, 'customers', user.uid, 'subscriptions');
    const q = query(subsCol, where('status', 'in', ['trialing', 'active']));
    const unsubSubs = onSnapshot(
      q,
      async (snap) => {
        const subs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (subs.length) {
          const tier = resolveTierFromSubscriptions(subs);
          setState({ tier, isLoading: false, subscriptions: subs, source: 'stripe' });
        } else {
          // 2) Fallback to users/{uid}.tier if no active subs
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const fallbackTier = userDoc.exists() && userDoc.data().tier ? userDoc.data().tier : TIERS.Free;
            setState({ tier: fallbackTier, isLoading: false, subscriptions: [], source: 'userDoc' });
          } catch {
            setState({ tier: TIERS.Free, isLoading: false, subscriptions: [], source: 'none' });
          }
        }
      },
      () => {
        // On snapshot error, fallback once
        setState((prev) => ({ ...prev, isLoading: false }));
      },
    );

    return () => unsubSubs();
  }, [user, authLoading]);

  const value = useMemo(() => state, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
