import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sectionPath, PROPERTY_SECTIONS } from "@/constants";

const SECTION = PROPERTY_SECTIONS.PURCHASE_PRICE;

export const getPurchasePrice = async (uid, propertyId) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const savePurchasePrice = async (uid, propertyId, data) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  await setDoc(ref, data, { merge: true });
};
