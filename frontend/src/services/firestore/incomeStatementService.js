import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sectionPath, PROPERTY_SECTIONS } from "@/constants";

const SECTION = PROPERTY_SECTIONS.INCOME_STATEMENT;

export const getIncomeStatement = async (uid, propertyId) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const saveIncomeStatement = async (uid, propertyId, data) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  await setDoc(ref, data, { merge: true });
};
