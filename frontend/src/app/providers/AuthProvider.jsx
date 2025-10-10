import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null); // priceId
  const [tier, setTier] = useState("free");               // readable
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  const priceIdToTier = {
    [import.meta.env.VITE_PRICE_FREE]: "free",
    [import.meta.env.VITE_PRICE_MARKETING]: "marketing",
    [import.meta.env.VITE_PRICE_DEVELOPER]: "developer",
    [import.meta.env.VITE_PRICE_SYNDICATOR]: "syndicator",
  };

  const tierToPriceId = {
    free: import.meta.env.VITE_PRICE_FREE,
    marketing: import.meta.env.VITE_PRICE_MARKETING,
    developer: import.meta.env.VITE_PRICE_DEVELOPER,
    syndicator: import.meta.env.VITE_PRICE_SYNDICATOR,
  };
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseUser.reload();
        const updatedUser = auth.currentUser;
        const idToken = await updatedUser.getIdToken(true);
        setToken(idToken);
        setUser(updatedUser);

        // Fetch Firestore subscription (priceId)
        const userRef = doc(db, "users", updatedUser.uid);
        const userSnap = await getDoc(userRef);

        const priceId = userSnap.exists() ? userSnap.data().priceId : null;
        setSubscription(priceId);

        const resolvedTier = priceIdToTier[priceId] || "free";
        setTier(resolvedTier);
      } else {
        setUser(null);
        setToken(null);
        setSubscription(null);
        setTier("free");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    setSubscription(null);
    setTier("free");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        subscription, // Stripe price ID
        tier,         // "free", "developer", etc.
        setSubscription,
        setToken,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
