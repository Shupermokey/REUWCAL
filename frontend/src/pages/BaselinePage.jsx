import React, { useState, useEffect } from 'react';
import {
  getBaselines,
  saveBaseline,
  deleteBaseline,
  subscribeToBaselines,
} from '../services/firestoreService';
import { useAuth } from '../app/AuthProvider';
import Sidebar from '../components/Sidebar';
import BaselineSection from '../features/baseline/BaselineAssumptions/BaselineSection';

const defaultRows = [
  { id: 0, name: 'Base Rent (MR) Growth Rate', percentBRI: 100, $PSF: 100, growthRate: 0 },
  { id: 1, name: 'Vacancy Rate', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 2, name: 'Property Tax Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 3, name: 'Property Insurance Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 4, name: 'Property Utility Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 5, name: 'Property CAM Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 6, name: 'Property Repair Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 7, name: 'Property Management Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 8, name: 'Subtotal OPEx', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 9, name: 'CAP Ex', percentBRI: 0, $PSF: 0, growthRate: 0 },
  { id: 10, name: 'Total Ex', percentBRI: 0, $PSF: 0, growthRate: 0 },
];

function BaselinePage() {
  const { user } = useAuth();
  const [baselines, setBaselines] = useState([]);
  const [selectedBaseline, setSelectedBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isPercent, setIsPercent] = useState(true);
  const [isPSF, setIsPSF] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToBaselines(user.uid, (data) => {
      setBaselines(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddBaseline = async () => {
    if (!user) return;
    const baselineName = prompt('Enter the name for the new baseline:');
    if (!baselineName) return;

    const newBaseline = {
      name: baselineName,
      rows: defaultRows,
    };

    const id = `${Date.now()}`; // or use Firestore's `addDoc` for auto-ID and fetch again
    await saveBaseline(user.uid, id, newBaseline);
    const updated = await getBaselines(user.uid);
    setBaselines(updated);
  };

  const handleSaveBaseline = async (baseline) => {
    if (!user) return;
    await saveBaseline(user.uid, baseline.id, {
      name: baseline.name,
      rows: baseline.rows,
    });
    alert('Baseline saved successfully!');
    setIsAddingRow(false);
  };

  const handleDeleteBaseline = async (id) => {
    if (!user) return;
    await deleteBaseline(user.uid, id);
    setSelectedBaseline(null);
    const updated = await getBaselines(user.uid);
    setBaselines(updated);
  };

  const handleCloneBaseline = async (baseline) => {
    if (!user) return;
    const newClone = {
      name: `${baseline.name} Copy`,
      rows: baseline.rows,
    };
    const id = `${Date.now()}-clone`;
    await saveBaseline(user.uid, id, newClone);
    const updated = await getBaselines(user.uid);
    setBaselines(updated);
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to view baselines.</p>;

  return (
    <>
      <Sidebar />
      <div className="baseline-wrapper">
        <header>
          <h1>Baseline Assumptions</h1>
          <button onClick={handleAddBaseline}>+ Add Baseline</button>
        </header>

        <div className="baseline-container">
          {baselines.map((baseline) => (
            <div
              key={baseline.id}
              className="baseline-card"
              onClick={() => setSelectedBaseline(baseline)}
            >
              <button onClick={(e) => { e.stopPropagation(); handleDeleteBaseline(baseline.id); }}>✖</button>
              <button onClick={(e) => { e.stopPropagation(); handleCloneBaseline(baseline); }}>⧉</button>
              <span>{baseline.name}</span>
            </div>
          ))}
        </div>

        {selectedBaseline && (
          <BaselineSection
            baseline={selectedBaseline}
            setBaseline={setSelectedBaseline}
            isPSF={isPSF}
            isPercent={isPercent}
            setIsPSF={setIsPSF}
            setIsPercent={setIsPercent}
            isAddingRow={isAddingRow}
            setIsAddingRow={setIsAddingRow}
            onSave={handleSaveBaseline}
            onDelete={() => handleDeleteBaseline(selectedBaseline.id)}
          />
        )}
      </div>
    </>
  );
}

export default BaselinePage;
