import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const path = (uid, pid) => doc(db, "users", uid, "properties", pid, "incomeStatement", "current");

export const getIncomeStatement = async (uid, pid) => {
  const snap = await getDoc(path(uid, pid));
  return snap.exists() ? snap.data() : null;
};

export const saveIncomeStatement = async (uid, pid, data) => {
  await setDoc(path(uid, pid), data, { merge: true });
};
