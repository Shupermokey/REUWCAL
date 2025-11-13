import { db } from "../firebaseConfig";
import { collection, getDocs, getDoc, onSnapshot, query, where } from "firebase/firestore";

/**
 * Get all active Stripe products with their prices.
 */
export const getStripeProducts = async () => {
  const q = query(collection(db, "products"), where("active", "==", true));
  const snap = await getDocs(q);

  const products = await Promise.all(
    snap.docs.map(async (productDoc) => {
      const priceSnap = await getDocs(
        collection(db, "products", productDoc.id, "prices")
      );
      return {
        id: productDoc.id,
        ...productDoc.data(),
        prices: priceSnap.docs.map((p) => ({ id: p.id, ...p.data() })),
      };
    })
  );

  return products;
};

/**
 * Subscribe to live updates for Stripe products.
 */
export const onStripeProductsSnapshot = (callback) => {
  const q = query(collection(db, "products"), where("active", "==", true));
  return onSnapshot(q, async (snap) => {
    const products = await Promise.all(
      snap.docs.map(async (productDoc) => {
        const priceSnap = await getDocs(
          collection(db, "products", productDoc.id, "prices")
        );
        return {
          id: productDoc.id,
          ...productDoc.data(),
          prices: priceSnap.docs.map((p) => ({ id: p.id, ...p.data() })),
        };
      })
    );
    callback(products);
  });
};
