import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { sectionPath, PROPERTY_SECTIONS } from "@/constants";
import { sumSectionColumns } from "@/domain/incomeStatement";
import { defaultStructure } from "@/utils/income";

const SECTION = PROPERTY_SECTIONS.INCOME_STATEMENT;
const SECTION_KEYS = ["Income", "OperatingExpenses", "CapitalExpenses"];

export const getIncomeStatement = async (uid, propertyId) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : defaultStructure;
};

export const saveIncomeStatement = async (uid, propertyId, data) => {
  const propertyRef = doc(db, `users/${uid}/properties/${propertyId}`);
  const currentRef = doc(
    db,
    `users/${uid}/properties/${propertyId}/incomeStatement/current`
  );

  // 🧹 Load existing data to detect deletions
  const snap = await getDoc(currentRef);
  const existing = snap.exists() ? snap.data() : {};

  // 🔍 Compare each section (Income, OperatingExpenses, CapitalExpenses)
  for (const section of SECTION_KEYS) {
    const oldSection = existing[section] || {};
    const newSection = data[section] || {};
    const deletedKeys = Object.keys(oldSection).filter((k) => !(k in newSection));

    for (const key of deletedKeys) {
      await updateDoc(currentRef, { [`${section}.${key}`]: deleteField() });
    }
  }

  // 💾 Merge new structure in (safe for other parallel updates)
await setDoc(currentRef, data, { merge: true });


  // 💰 Compute rolled-up total for property summary
  const totalIncome = sumSectionColumns(data?.Income || {}).grossAnnual || 0;
  await updateDoc(propertyRef, {
    incomeStatement: totalIncome,
    updatedAt: serverTimestamp(),
  });

  return totalIncome;
};
