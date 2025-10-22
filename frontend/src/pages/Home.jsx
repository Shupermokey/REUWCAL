import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Table from "../features/table/Table";
import { useApp } from "../app/providers/AppProvider";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../app/providers/AuthProvider";
import { loadStripe } from "@stripe/stripe-js";
import { db } from "../services/firebaseConfig";
import "@/styles/pages/Home.css"; // ✅ Scoped page styles

// const stripePromise = loadStripe(
//   "pk_test_51NbDDDEgiGJZMTseM8sReTmk3TwiQIQwZLOwEzVHXy0uZFt7Ikn3qIc2sbKts0tFEBN5d73GFG46qA7KMbYBj5OX00SUx5fV2y"
// );

function Home() {
  const { base } = useApp();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);


  const handleRowSelect = (row) => {
    setSelectedRow(row);
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
        </section>
      </main>
    </div>
  );
}

export default Home;
