import React, { useState } from "react";
import Table from "../features/table/Table";
import { useAuth } from "../app/providers/AuthProvider";
import { useSubscription } from "../app/providers/SubscriptionProvider";
import "@/styles/pages/Home.css";
import Sidebar from "@/components/Sidebar/Sidebar";

function Home() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowSelect = (row) => {
    setSelectedRow(row);
  };

  return (
    <div className="home">
      <Sidebar />

      <main className="home__main">
        <header className="home__header">
          <div className="home__header-content">
            <h1>Property Dashboard</h1>
            <p className="home__header-subtitle">
              Manage and analyze your real estate portfolio
            </p>
          </div>
          <div className="home__header-actions">
            <span className="home__tier-badge">{tier || 'Free'} Plan</span>
          </div>
        </header>

        <section className="home__content">
          <Table onRowSelect={handleRowSelect} />
        </section>
      </main>
    </div>
  );
}

export default Home;
