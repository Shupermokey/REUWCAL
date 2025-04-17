// Import necessary Firebase hooks and methods
import { useState, useEffect } from 'react';
import { db } from "../firebase/firebaseConfig"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from "../context/AuthProvider"
import Sidebar from '../components/Sidebar'

const defaultRows = [
  { id: 0, name: 'Base Rent (MR) Growth Rate', percentBRI: 100, $PSF:100, growthRate: 0 },
  { id: 1, name: 'Vacancy Rate', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 2, name: 'Property Tax Expenses', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 3, name: 'Property Insurance Expenses', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 4, name: 'Property Utility Expenses', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 5, name: 'Property CAM Expenses', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 6, name: 'Property Repair Expenses', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 7, name: 'Property Management Expenses', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 8, name: 'Subtotal OPEx', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 9, name: 'CAP Ex', percentBRI: 0,$PSF:0, growthRate: 0 },
  { id: 10, name: 'Total Ex ', percentBRI: 0,$PSF:0, growthRate: 0 },
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
    const unsubscribe = onSnapshot(
      collection(db, `users/${user.uid}/baselines`),
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBaselines(data);
      },
      (error) => {
        console.error('Error fetching baselines:', error);
      }
    );
    setLoading(false);
    return () => unsubscribe();
  }, [user]);

  const handleAddBaseline = async () => {
    if (!user) return;
    const baselineName = prompt('Enter the name for the new baseline:');
    if (!baselineName) return;

    await addDoc(collection(db, `users/${user.uid}/baselines`), {
      name: baselineName,
      rows: defaultRows,
    });
  };

  const handleSaveBaseline = async (baseline) => {
    if (!user) return;
    const baselineRef = doc(db, `users/${user.uid}/baselines`, baseline.id);
    await updateDoc(baselineRef, { name: baseline.name, rows: baseline.rows });
    setIsAddingRow(false);
    alert('Baseline saved successfully!');
  };

  const handleDeleteBaseline = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/baselines`, id));
    setSelectedBaseline(null);
  };

  const handleDeleteRow = (rowId) => {
    setSelectedBaseline((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== rowId),
    }));
  };

  const handleCloneBaseline = async (baseline) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/baselines`), {
      name: `${baseline.name} Copy`,
      rows: baseline.rows,
    });
  };

  // const handleRowChange = (baselineId, rowId, field, value) => {
  //   setSelectedBaseline((prev) => ({
  //     ...prev,
  //     rows: prev.rows.map((row) =>
  //       row.id === rowId ? { ...row, [field]: value } : row
  //     ),
  //   }));
  // };

  const handleRowChange = (baselineId, rowId, field, value) => {
    if (field === 'percentBRI') {
      if (value < 0) return;
  
      setSelectedBaseline((prev) => {
        const otherRowsTotal = prev.rows
          .filter(row => row.id !== 0 && row.id !== rowId)
          .reduce((acc, row) => acc + (row.percentBRI || 0), 0);
  
        const maxAllowed = 100 - otherRowsTotal;
        if (value > maxAllowed) value = maxAllowed;
  
        const updatedRows = prev.rows.map(row => {
          if (row.id === rowId) return { ...row, percentBRI: value };
          if (row.id === 0) return { ...row, percentBRI: +(100 - otherRowsTotal - value).toFixed(2) };
          return row;
        });
  
        return { ...prev, rows: updatedRows };
      });
      return;
    }
  
    setSelectedBaseline((prev) => ({
      ...prev,
      rows: prev.rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };
  

  const handleAddRow = () => {
    if (isAddingRow) return;
    const newRowId = selectedBaseline.rows.length;
    const newRow = { id: newRowId, name: '', percentBRI: '', growthRate: '' };
    setSelectedBaseline((prev) => ({
      ...prev,
      rows: [...prev.rows.slice(0, -3), newRow, ...prev.rows.slice(-3)],
    }));
    setIsAddingRow(true);
  };

  const handleAddRowTwo = () => {
    if (isAddingRow) return;
    const newRowId = selectedBaseline.rows.length;
    const newRow = { id: newRowId, name: '', percentBRI: '', growthRate: '' };
    setSelectedBaseline((prev) => ({
      ...prev,
      rows: [...prev.rows.slice(0, -1), newRow, ...prev.rows.slice(-1)],
    }));
    setIsAddingRow(true);
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
        <div className="baseline-table-container">
          <h2>Editing: {selectedBaseline.name}</h2>
          <h5>{isPSF ? "Editing BRI" : "Editing PSF"}</h5>
          <button onClick={() => {
            setIsPercent(!isPercent)
            setIsPSF(!isPSF)
          }
          }>Click Me</button>
          <table>
            <thead>
              <tr>
                <th>Expense Type</th>
                {/* <th>% of BRI</th> */}
                <th>{isPSF ? '% BRI' : '$ PSF'}</th>
                <th>Growth Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedBaseline.rows.map((row) => (
                <tr key={row.id}>
                  <td><input value={row.name} onChange={(e) => handleRowChange(selectedBaseline.id, row.id, 'name', e.target.value)} /></td>
                  {/* <td><input value={row.percentBRI} disabled={isPercent} onChange={(e) => handleRowChange(selectedBaseline.id, row.id, 'percentBRI', e.target.value)} /></td> */}
                  <td><input type='number' value={isPSF ? row.percentBRI : row.$PSF}  onChange={(e) =>       handleRowChange(selectedBaseline.id, row.id, isPSF ? 'percentBRI' : 'PSF', parseFloat(e.target.value) || 0)} />  <span>{isPSF ? '%' : '$'}</span></td>
                  <td><input type='number' value={row.growthRate} onChange={(e) => handleRowChange(selectedBaseline.id, row.id, 'growthRate', parseFloat(e.target.value) || 0)} />  <span>{isPSF ? '%' : '$'}</span></td>
                  <td><button onClick={() => handleDeleteRow(row.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="button-group">
            <button onClick={() => handleSaveBaseline(selectedBaseline)}>✓ Save</button>
            <button onClick={() => handleDeleteBaseline(selectedBaseline.id)}>🗑 Delete</button>
            <button onClick={handleAddRow} disabled={isAddingRow}>+ OPEx Add Row</button>
            <button onClick={handleAddRowTwo} disabled={isAddingRow}>+ CAPEx Add Row</button>
          <button onClick={() => {setSelectedBaseline(null)
            setIsAddingRow(false)
          }}>✖ Cancel</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default BaselinePage;
