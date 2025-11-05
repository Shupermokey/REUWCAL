import React, { useEffect, useState } from "react";

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
import { db } from "../services/firebaseConfig";
import "@/styles/pages/Home.css"; // ✅ Scoped page styles
import Sidebar from "@/components/Sidebar/Sidebar";


function Home() {
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
          {<Table onRowSelect={handleRowSelect} />}
        </section>
      </main>
    </div>
  );
}

export default Home;
