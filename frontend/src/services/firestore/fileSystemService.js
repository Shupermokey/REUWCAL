import { db } from "../firebaseConfig";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";

export const addFolder = async (pathArray, name) => {
  const ref = doc(collection(db, ...pathArray));
  await setDoc(ref, { title: name, type: "folder", createdAt: serverTimestamp() });
};

export const fetchFolderTree = async (uid, pid, matchKey) => {
  const basePath = ["users", uid, "properties", pid, "fileSystem"];
  const snap = await getDocs(collection(db, ...basePath));
  const docSnap = snap.docs.find((d) => d.id === matchKey && d.data().type === "folder");
  if (!docSnap) return [];
  const root = { id: docSnap.id, title: docSnap.data().title, path: [...basePath, docSnap.id], children: [] };
  await fetchSubfolders([...basePath, docSnap.id, "folders"], root.children);
  return [root];
};

const fetchSubfolders = async (path, target) => {
  const snap = await getDocs(collection(db, ...path));
  for (const docSnap of snap.docs) {
    if (docSnap.data().type === "folder") {
      const child = {
        id: docSnap.id,
        title: docSnap.data().title,
        path: [...path.slice(0, -1), docSnap.id],
        children: [],
      };
      await fetchSubfolders([...path, docSnap.id, "folders"], child.children);
      target.push(child);
    }
  }
};
