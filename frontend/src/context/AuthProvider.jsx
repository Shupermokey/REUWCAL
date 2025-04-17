// import { createContext, useContext, useEffect, useState } from "react";

// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { auth, db } from "../firebase/firebaseConfig";
// import SubscriptionUpgrade from "../components/Subscription/SubscriptionUpgrade";

// // ✅ Create Context
// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [subscription, setSubscription] = useState("free"); 
//     const [userLoggedIn, setUserLoggedIn] = useState(false);
//     const [loading, setLoading] = useState(true);
//     const [token, setToken] = useState("");
//     const [emailVerified, setEmailVerified] = useState(false);

    
//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//             if (firebaseUser) {
//                 await firebaseUser.reload(); 
//                 const updatedUser = auth.currentUser;
//                 const token = await updatedUser.getIdToken(true);

//                 setToken(token);
//                 setUser(updatedUser);
    
//                 const userRef = doc(db, "users", updatedUser.uid);
//                 const userSnap = await getDoc(userRef);
    
//                 if (userSnap.exists()) {
//                     setSubscription(userSnap.data().subscriptionTier || "free");
//                 }
//             } else {
//                 setUser(null);
//                 setSubscription("free");
//             }
//             setLoading(false);
//         });
    
//         return () => unsubscribe();
//     }, []);


//     const fetchSubscription = async (uid) => {
//         if (!uid) return;
    
//         try {
//             console.log("🔄 Fetching subscription from Firestore...");
//             const userDoc = await getDoc(doc(db, "users", uid));
    
//             if (userDoc.exists()) {
//                 console.log("🔥 Firestore Data:", userDoc.data()); // ✅ Debug Firestore response
    
//                 const subscriptionData = userDoc.data().subscriptionTier || "free"; // ✅ Ensure it uses `subscriptionTier`
//                 console.log(`✅ Subscription Fetched from Firestore: ${subscriptionData}`);
    
//                 setSubscription(subscriptionData); // ✅ Update state
//             } else {
//                 console.warn("⚠️ No subscription data found in Firestore. Defaulting to Free.");
//                 setSubscription("free");
//             }
//         } catch (error) {
//             console.error("❌ Error fetching subscription:", error);
//         }
//     };
    


//     const value = {
//         user,
//         userLoggedIn,
//         loading,
//         token,
//         setToken,
//         subscription,
//         setSubscription,
//         fetchSubscription
//     }

//     return (
//         <AuthContext.Provider value={value}>
//             {!loading && children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

// ✅ Create Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState("free");
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await firebaseUser.reload();
                const updatedUser = auth.currentUser;
                const token = await updatedUser.getIdToken(true);

                setToken(token);
                setUser(updatedUser);

                // ✅ Fetch subscription from Firestore
                const userRef = doc(db, "users", updatedUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setSubscription(userSnap.data().priceId || "free");
                }
            } else {
                setUser(null);
                setSubscription("free");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        loading,
        token,
        subscription,
        setSubscription,
        setToken
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
