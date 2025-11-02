///services/firestoreService.js
import {
  doc,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ─────────────────────────────────────────────
// 📊 Property Row Functions
// ─────────────────────────────────────────────

export const addRow = async (userId, propertyId, rowData) => {
  const colRef = collection(
    db,
    `users/${userId}/properties/${propertyId}/rows`
  );
  const docRef = await addDoc(colRef, {
    ...rowData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRowsByProperty = async (userId, propertyId) => {
  const colRef = collection(
    db,
    `users/${userId}/properties/${propertyId}/rows`
  );
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateRow = async (userId, propertyId, rowId, updates) => {
  const docRef = doc(
    db,
    `users/${userId}/properties/${propertyId}/rows/${rowId}`
  );
  await updateDoc(docRef, updates);
};

export const deleteRow = async (userId, propertyId, rowId) => {
  const docRef = doc(
    db,
    `users/${userId}/properties/${propertyId}/rows/${rowId}`
  );
  await deleteDoc(docRef);
};

// ─────────────────────────────────────────────
// 📐 Baseline Functions
// ─────────────────────────────────────────────

export const getBaselines = async (userId) => {
  const colRef = collection(db, `users/${userId}/baselines`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const saveBaseline = async (userId, baselineId, baselineData) => {
  const docRef = doc(db, `users/${userId}/baselines/${baselineId}`);
  await setDoc(docRef, {
    ...baselineData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBaseline = async (userId, baselineId) => {
  const docRef = doc(db, `users/${userId}/baselines/${baselineId}`);
  await deleteDoc(docRef);
};

export const getBaselineById = async (userId, baselineId) => {
  const docRef = doc(db, `users/${userId}/baselines/${baselineId}`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

// Subscribe to realtime baselines
export const subscribeToBaselines = (userId, callback, onError = console.error) => {
  const colRef = collection(db, `users/${userId}/baselines`);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const baselines = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(baselines);
    },
    onError
  );
};

// ─────────────────────────────────────────────
// 📚 Scenario Functions (Optional)
// ─────────────────────────────────────────────

export const getScenariosByRow = async (userId, propertyId, rowId) => {
  const colRef = collection(
    db,
    `users/${userId}/properties/${propertyId}/rows/${rowId}/scenarios`
  );
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const saveScenario = async (userId, propertyId, rowId, scenarioData) => {
  const colRef = collection(
    db,
    `users/${userId}/properties/${propertyId}/rows/${rowId}/scenarios`
  );
  const docRef = await addDoc(colRef, {
    ...scenarioData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteScenario = async (userId, propertyId, rowId, scenarioId) => {
  const docRef = doc(
    db,
    `users/${userId}/properties/${propertyId}/rows/${rowId}/scenarios/${scenarioId}`
  );
  await deleteDoc(docRef);
};

// ─────────────────────────────────────────────
// 📁 File System Helpers for Folder Tree
// ─────────────────────────────────────────────

export const fetchMatchingFolderTree = async (userId, propertyId, matchKey) => {
  const basePath = ["users", userId, "properties", propertyId, "fileSystem"];
  const snapshot = await getDocs(collection(db, ...basePath));
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.type === "folder" && docSnap.id === matchKey) {
      const rootFolder = {
        id: docSnap.id,
        title: data.title,
        path: [...basePath, docSnap.id],
        children: [],
      };
      await fetchSubfolders(
        [...basePath, docSnap.id, "folders"],
        rootFolder.children
      );
      return [rootFolder];
    }
  }
  return [];
};

const fetchSubfolders = async (path, target) => {
  const snapshot = await getDocs(collection(db, ...path));
  for (const docSnap of snapshot.docs) {
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

export const addFolder = async (pathArray, folderName) => {
  const folderRef = doc(collection(db, ...pathArray));
  await setDoc(folderRef, {
    title: folderName,
    type: "folder",
    createdAt: serverTimestamp(),
  });
};

// ─────────────────────────────
// 🏘️ Property CRUD
// ─────────────────────────────

export const getProperties = async (userId) => {
  const colRef = collection(db, `users/${userId}/properties`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addProperty = async (userId, data) => {
  const colRef = collection(db, `users/${userId}/properties`);
 const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateProperty = async (userId, propertyId, data) => {
  const docRef = doc(db, `users/${userId}/properties/${propertyId}`);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteProperty = async (userId, propertyId) => {
  const docRef = doc(db, `users/${userId}/properties/${propertyId}`);
  await deleteDoc(docRef);
};

export const initializeFileSystem = async (
  userId,
  propertyId,
  columnOrder = []
) => {
  const fileSystemBasePath = collection(
    db,
    `users/${userId}/properties/${propertyId}/fileSystem`
  );

  await setDoc(
    doc(fileSystemBasePath, "README"),
    {
      note: "This is the file system for this property",
      createdAt: new Date(),
    },
    { merge: true }
  );

  await Promise.all(
    columnOrder.map((header) =>
      setDoc(doc(fileSystemBasePath, header), {
        type: "folder",
        name: header,
        createdAt: new Date(),
      })
    )
  );
};

export const subscribeToProperties = (userId, callback, onError = console.error) => {
  const colRef = collection(db, `users/${userId}/properties`);
  const q = query(colRef, /* add indexes in Firestore */ orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const properties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(properties);
  }, onError);
};

export const getUserMetadata = async (userId) => {
  const docRef = doc(db, `users/${userId}`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const getUserSubscriptions = async (userId) => {
  const colRef = collection(db, `customers/${userId}/subscriptions`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createUserProfile = async (userId, data) => {
  const docRef = doc(db, `users/${userId}`);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
  }, { merge: true });
};

const DEBUG = true;
const log = (...a) => DEBUG && console.debug("[IncomeStmt]", ...a);


const incomeStatementDocRef = (uid, propertyId) =>
  doc(db, "users", uid, "properties", propertyId, "incomeStatement", "current");

export async function getIncomeStatement(uid, propertyId) {
  const ref = incomeStatementDocRef(uid, propertyId);
  log("GET path:", ref.path);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    log("GET result: <missing>");
    return null;
  }
  const data = snap.data();
  // be careful not to stringify circular refs
  log("GET result keys:", Object.keys(data));
  log("GET Income keys:", Object.keys(data?.Income || {}));
  return data;
}

export async function saveIncomeStatement(uid, propertyId, data) {
  const ref = incomeStatementDocRef(uid, propertyId);
  // Shallow preview of what we’re about to write:
  log("SAVE path:", ref.path);
  log("SAVE root keys:", Object.keys(data || {}));
  log("SAVE Income keys:", Object.keys(data?.Income || {}));
  await setDoc(ref, data, { merge: true });
  log("SAVE done");
}






