// // Component: BaselinePage.jsx
// import React, { useState, useEffect } from 'react';
// import { db } from "../firebase/firebaseConfig";
// import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
// import { useAuth } from "../context/AuthProvider";
// import Sidebar from '../components/Sidebar';
// import BaselineSection from './BaselineSection';

// const defaultRows = [
//   { id: 0, name: 'Base Rent (MR) Growth Rate', percentBRI: 100, $PSF: 100, growthRate: 0 },
//   { id: 1, name: 'Vacancy Rate', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 2, name: 'Property Tax Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 3, name: 'Property Insurance Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 4, name: 'Property Utility Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 5, name: 'Property CAM Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 6, name: 'Property Repair Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 7, name: 'Property Management Expenses', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 8, name: 'Subtotal OPEx', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 9, name: 'CAP Ex', percentBRI: 0, $PSF: 0, growthRate: 0 },
//   { id: 10, name: 'Total Ex ', percentBRI: 0, $PSF: 0, growthRate: 0 },
// ];

// function BaselinePage() {
//   const { user } = useAuth();
//   const [baselines, setBaselines] = useState([]);
//   const [selectedBaseline, setSelectedBaseline] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isAddingRow, setIsAddingRow] = useState(false);
//   const [isPercent, setIsPercent] = useState(true);
//   const [isPSF, setIsPSF] = useState(false);

//   useEffect(() => {
//     if (!user) return;
//     const unsubscribe = onSnapshot(
//       collection(db, `users/${user.uid}/baselines`),
//       (querySnapshot) => {
//         const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//         setBaselines(data);
//       },
//       (error) => {
//         console.error('Error fetching baselines:', error);
//       }
//     );
//     setLoading(false);
//     return () => unsubscribe();
//   }, [user]);

//   const handleAddBaseline = async () => {
//     if (!user) return;
//     const baselineName = prompt('Enter the name for the new baseline:');
//     if (!baselineName) return;
//     await addDoc(collection(db, `users/${user.uid}/baselines`), {
//       name: baselineName,
//       rows: defaultRows,
//     });
//   };

//   const handleSaveBaseline = async (baseline) => {
//     if (!user) return;
//     const baselineRef = doc(db, `users/${user.uid}/baselines`, baseline.id);
//     await updateDoc(baselineRef, { name: baseline.name, rows: baseline.rows });
//     setIsAddingRow(false);
//     alert('Baseline saved successfully!');
//   };

//   const handleDeleteBaseline = async (id) => {
//     if (!user) return;
//     await deleteDoc(doc(db, `users/${user.uid}/baselines`, id));
//     setSelectedBaseline(null);
//   };

//   const handleCloneBaseline = async (baseline) => {
//     if (!user) return;
//     await addDoc(collection(db, `users/${user.uid}/baselines`), {
//       name: `${baseline.name} Copy`,
//       rows: baseline.rows,
//     });
//   };

//   if (loading) return <p>Loading...</p>;
//   if (!user) return <p>Please log in to view baselines.</p>;

//   return (
//     <>
//       <Sidebar />
//       <div className="baseline-wrapper">
//         <header>
//           <h1>Baseline Assumptions</h1>
//           <button onClick={handleAddBaseline}>+ Add Baseline</button>
//         </header>

//         <div className="baseline-container">
//           {baselines.map((baseline) => (
//             <div
//               key={baseline.id}
//               className="baseline-card"
//               onClick={() => setSelectedBaseline(baseline)}
//             >
//               <button onClick={(e) => { e.stopPropagation(); handleDeleteBaseline(baseline.id); }}>✖</button>
//               <button onClick={(e) => { e.stopPropagation(); handleCloneBaseline(baseline); }}>⧉</button>
//               <span>{baseline.name}</span>
//             </div>
//           ))}
//         </div>

//         {selectedBaseline && (
//           <BaselineSection
//             baseline={selectedBaseline}
//             setBaseline={setSelectedBaseline}
//             isPSF={isPSF}
//             isPercent={isPercent}
//             setIsPercent={setIsPercent}
//             setIsPSF={setIsPSF}
//             isAddingRow={isAddingRow}
//             setIsAddingRow={setIsAddingRow}
//             onSave={handleSaveBaseline}
//             onDelete={() => handleDeleteBaseline(selectedBaseline.id)}
//           />
//         )}
//       </div>
//     </>
//   );
// }

// export default BaselinePage;

import React, { useState, useEffect } from 'react';
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from "../context/AuthProvider";
import Sidebar from '../components/Sidebar';
import '../components/BaselineAssumptions/BaselineSection'
import BaselineSection from '../components/BaselineAssumptions/BaselineSection';


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

  const handleCloneBaseline = async (baseline) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/baselines`), {
      name: `${baseline.name} Copy`,
      rows: baseline.rows,
    });
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
