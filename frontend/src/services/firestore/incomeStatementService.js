import { db } from "../firebaseConfig";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { sectionPath, PROPERTY_SECTIONS } from "@/constants";
import { sumSectionColumns } from "@/domain/incomeStatement";

const SECTION = PROPERTY_SECTIONS.INCOME_STATEMENT;

export const getIncomeStatement = async (uid, propertyId) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};


export const saveIncomeStatement = async (uid, propertyId, data) => {
  const propertyRef = doc(db, `users/${uid}/properties/${propertyId}`);
  const currentRef = doc(db, `users/${uid}/properties/${propertyId}/incomeStatement/current`);

  // 🔹 Save the full structure first
  await setDoc(currentRef, data, { merge: true });

  // 🔹 Then compute the rolled-up total
  const totalIncome = sumSectionColumns(data?.Income || {}).grossAnnual || 0;

  // 🔹 Update the summary field on the property itself
  await updateDoc(propertyRef, {
    incomeStatement: totalIncome,
    updatedAt: serverTimestamp(),
  });

  return totalIncome;
};
