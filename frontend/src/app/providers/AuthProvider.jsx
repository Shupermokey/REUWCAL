import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { saveBaseline } from "@/services/firestore/baselinesService";
import { DEFAULT_BASELINE_ID, getDefaultBaseline } from "@/utils/baseline/createDefaultBaseline";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseUser.reload();
        const updatedUser = auth.currentUser;
        const idToken = await updatedUser.getIdToken(true);
        setToken(idToken);
        setUser(updatedUser);

        // Create default baseline for new users
        try {
          const baselineRef = doc(db, "users", updatedUser.uid, "baselines", DEFAULT_BASELINE_ID);
          const baselineSnap = await getDoc(baselineRef);

          if (!baselineSnap.exists()) {
            // User doesn't have a default baseline, create one
            await saveBaseline(updatedUser.uid, DEFAULT_BASELINE_ID, getDefaultBaseline());
          }
        } catch (error) {
          console.error("Error creating default baseline:", error);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        setToken,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
