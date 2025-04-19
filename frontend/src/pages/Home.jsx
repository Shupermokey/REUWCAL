import React, { useEffect, useState } from "react";
import { ScenarioProvider } from "../context/ScenarioRowProvider";
import { RowProvider } from "../context/RowProvider";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import { useApp } from "../context/AppProvider";
import { useTable } from "../context/TableProvider";
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
import { useAuth } from "../context/AuthProvider";
import { loadStripe } from "@stripe/stripe-js";

import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebaseConfig";
import Pricing from "../components/Pricing/Pricing";
import PerformaTable from "../components/Performa/PerformaTable";

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

  const baselineMap = {
    baseRentGrowth: "Base Rent (MR) Growth Rate",
    vacancyRate: "Vacancy Rate",
    propertyTaxExpenses: "Property Tax Expenses",
    insurance: "Property Insurance Expenses",
    utilities: "Property Utility Expenses",
    repairs: "Property Repair Expenses",
    cam: "Property CAM Expenses",
    management: "Property Management Expenses",
    capex: "CAP Ex"
  }; // 🔴 Map expense field names to Baseline rows

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
      const snapshot = await getDocs(collection(db, "users", user.uid, "baselines"));
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
      <ScenarioProvider>
        <RowProvider>
          <Sidebar />
          <div style={{ display: "flex", flexDirection: "column" }}>
          {base === false && <Table onRowSelect={handleRowSelect} />} {/* 🔴 Pass down row select */}
          {base !== false && <BaselineTable />}
            {/* <SubscriptionUpgrade /> */}

            {/* <div>
            {selectedRow && (
              <PerformaTable
              baseRow={selectedRow}
              baselines={baselines}
              scenarioRows={scenarioRows}
              setScenarioRows={setScenarioRows}
              baselineMap={baselineMap} // 🔴 Provide mapping to Proforma
              />
            )}
          </div> */}
          </div>
          {/* 🔴 NEW: Render Proforma Table */}
         
        </RowProvider>
      </ScenarioProvider>
    </>
  );
}

export default Home;
