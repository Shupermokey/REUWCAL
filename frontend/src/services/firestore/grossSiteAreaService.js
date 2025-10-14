import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sectionPath, PROPERTY_SECTIONS } from "@/constants";

const SECTION = PROPERTY_SECTIONS.GROSS_SITE_AREA;

export const getGrossSiteArea = async (uid, propertyId) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const saveGrossSiteArea = async (uid, propertyId, data) => {
  const ref = doc(db, sectionPath(uid, propertyId, SECTION));
  await setDoc(ref, data, { merge: true });
};
