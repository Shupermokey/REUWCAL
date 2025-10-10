import React, { useEffect, useState } from "react";
import { ScenarioProvider } from "../app/providers/ScenarioRowProvider";
// import { RowProvider } from "../app/providers/RowProvider";
import Sidebar from "../components/Sidebar";
import Table from "../features/table/Table";
import { useApp } from "../app/providers/AppProvider";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "../app/providers/AuthProvider";
import { loadStripe } from "@stripe/stripe-js";

import { db } from "../services/firebaseConfig";

const stripePromise = loadStripe(
  "pk_test_51NbDDDEgiGJZMTseM8sReTmk3TwiQIQwZLOwEzVHXy0uZFt7Ikn3qIc2sbKts0tFEBN5d73GFG46qA7KMbYBj5OX00SUx5fV2y"
);

function Home() {
  const { base } = useApp();
  const [products, setProducts] = useState([]);
  const { user } = useAuth();
  const [selectedRow, setSelectedRow] = useState(null); // 🔴 NEW
  const [scenarioRows, setScenarioRows] = useState([]); // 🔴 NEW
  const [baselines, setBaselines] = useState([]); // 🔴 NEW

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products"); // ✅ Correct Firestore collection reference
        const q = query(productsCollection, where("active", "==", true));

        const snapshot = await getDocs(q);
        const productList = [];

        for (const productDoc of snapshot.docs) {
          const productData = productDoc.data();
          const productId = productDoc.id;

          const priceRef = collection(db, "products", productId, "prices"); // ✅ Correct subcollection reference
          const priceSnapshot = await getDocs(priceRef);
          const prices = priceSnapshot.docs.map((priceDoc) => ({
            priceId: priceDoc.id,
            priceData: priceDoc.data(),
          }));

          productList.push({
            id: productId,
            ...productData,
            prices, // ✅ Add price data
          });
        }

        setProducts(productList);
      } catch (error) {
        console.error("❌ Error fetching products:", error.message);
      }
    };

    fetchProducts();
  }, []); // ✅ Run only once on component mount

  useEffect(() => {
    if (!user) return;
    const fetchBaselines = async () => {
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "baselines")
      );
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBaselines(data);
    };
    fetchBaselines();
  }, [user]);

  const handleRowSelect = (row) => {
    setSelectedRow(row);
    setScenarioRows([row]); // Start with a copy of the base row
  };

  return (
    <>
          <Sidebar />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {base === false && <Table onRowSelect={handleRowSelect} />}{" "}
            {base !== false && <BaselineTable />}
          </div>
    </>
  );
}

export default Home;
