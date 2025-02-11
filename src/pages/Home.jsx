import React from "react";
import { ScenarioProvider } from "../context/ScenarioRowProvider";
import { RowProvider } from "../context/RowProvider";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import BaselineTable from "../components/BaselineTable";
import { useApp } from "../context/AppProvider";
import { useTable } from "../context/TableProvider";
import FeatureX from "../components/Features/FeatureX";
import { SubscriptionProvider } from "../context/SubscriptionProvider";

function Home() {
    const { base } = useApp();
    const { selectedRow } = useTable();
  return (
    <>
      <ScenarioProvider>
        <RowProvider>
          <SubscriptionProvider>
          <Sidebar />
          <FeatureX />
          {base === false && <Table />}
          {base !== false && <BaselineTable />}
          </SubscriptionProvider>
        </RowProvider>
      </ScenarioProvider>
    </>
  );
}

export default Home;
