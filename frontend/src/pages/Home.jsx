import React, { useEffect, useState } from "react";
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
import "@/styles/pages/Home.css"; // ✅ Scoped page styles

const stripePromise = loadStripe(
  "pk_test_51NbDDDEgiGJZMTseM8sReTmk3TwiQIQwZLOwEzVHXy0uZFt7Ikn3qIc2sbKts0tFEBN5d73GFG46qA7KMbYBj5OX00SUx5fV2y"
);

function Home() {
  const { base } = useApp();
  const [products, setProducts] = useState([]);
  const { user } = useAuth();
  const [selectedRow, setSelectedRow] = useState(null);
  const [scenarioRows, setScenarioRows] = useState([]);
  const [baselines, setBaselines] = useState([]);

  // Fetch product list
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const q = query(productsCollection, where("active", "==", true));
        const snapshot = await getDocs(q);
        const productList = [];

        for (const productDoc of snapshot.docs) {
          const productData = productDoc.data();
          const productId = productDoc.id;
          const priceRef = collection(db, "products", productId, "prices");
          const priceSnapshot = await getDocs(priceRef);
          const prices = priceSnapshot.docs.map((priceDoc) => ({
            priceId: priceDoc.id,
            priceData: priceDoc.data(),
          }));
          productList.push({
            id: productId,
            ...productData,
            prices,
          });
        }

        setProducts(productList);
      } catch (error) {
        console.error("❌ Error fetching products:", error.message);
      }
    };
    fetchProducts();
  }, []);

  // Fetch baselines
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
    setScenarioRows([row]);
  };

  return (
    <div className="home">
      <aside className="home__sidebar">
        <Sidebar />
      </aside>

      <main className="home__main">
        <header className="home__header">
          <h1>Property Dashboard</h1>
        </header>

        <section className="home__table-wrapper">
          {base === false && <Table onRowSelect={handleRowSelect} />}
          {base !== false && <BaselineTable />}
        </section>

        <footer className="home__add-row">
          <button>+ Add Row</button>
        </footer>
      </main>
    </div>
  );
}

export default Home;
