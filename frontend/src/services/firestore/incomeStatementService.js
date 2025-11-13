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
import { defaultStructure } from "@/utils/income";

const SECTION = PROPERTY_SECTIONS.INCOME_STATEMENT;
const SECTION_KEYS = ["Income", "OperatingExpenses", "CapitalExpenses"];

export const getIncomeStatement = async (uid, propertyId) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : defaultStructure;
};

export const saveIncomeStatement = async (uid, propertyId, data) => {
  const currentRef = doc(
    db,
    `users/${uid}/properties/${propertyId}/incomeStatement/current`
  );

    await setDoc(currentRef, data, { merge: true });

};
