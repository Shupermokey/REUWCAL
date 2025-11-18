// src/services/firebase/storageService.js
import { storage, db } from "../firebaseConfig";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getStoragePath, getFileMetadataPath } from "@/constants/fileSystemStructure";

/**
 * Upload a file to Firebase Storage and save metadata to Firestore
 */
export const uploadFile = async (userId, propertyId, sectionId, subfolderId, file) => {
  try {
    // Create storage path
    const storagePath = getStoragePath(userId, propertyId, sectionId, subfolderId, file.name);
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore
    const fileId = `${sectionId}_${subfolderId}_${Date.now()}`;
    const metadataPath = getFileMetadataPath(userId, propertyId);
    const fileDocRef = doc(db, metadataPath, fileId);

    const metadata = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      sectionId,
      subfolderId,
      storagePath,
      downloadURL,
      uploadedAt: serverTimestamp(),
    };

    await setDoc(fileDocRef, metadata);

    return { success: true, file: metadata };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all files for a property
 */
export const getPropertyFiles = async (userId, propertyId) => {
  try {
    const metadataPath = getFileMetadataPath(userId, propertyId);
    const filesCollectionRef = collection(db, metadataPath);
    const querySnapshot = await getDocs(filesCollectionRef);

    const files = [];
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, files };
  } catch (error) {
    console.error("Error getting property files:", error);
    return { success: false, error: error.message, files: [] };
  }
};

/**
 * Get files for a specific section and subfolder
 */
export const getSectionFiles = async (userId, propertyId, sectionId, subfolderId = null) => {
  try {
    const metadataPath = getFileMetadataPath(userId, propertyId);
    const filesCollectionRef = collection(db, metadataPath);

    let q;
    if (subfolderId) {
      q = query(
        filesCollectionRef,
        where("sectionId", "==", sectionId),
        where("subfolderId", "==", subfolderId)
      );
    } else {
      q = query(filesCollectionRef, where("sectionId", "==", sectionId));
    }

    const querySnapshot = await getDocs(q);
    const files = [];
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, files };
  } catch (error) {
    console.error("Error getting section files:", error);
    return { success: false, error: error.message, files: [] };
  }
};

/**
 * Delete a file from Storage and Firestore
 */
export const deleteFile = async (userId, propertyId, fileId, storagePath) => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // Delete metadata from Firestore
    const metadataPath = getFileMetadataPath(userId, propertyId);
    const fileDocRef = doc(db, metadataPath, fileId);
    await deleteDoc(fileDocRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get file metadata by ID
 */
export const getFileMetadata = async (userId, propertyId, fileId) => {
  try {
    const metadataPath = getFileMetadataPath(userId, propertyId);
    const fileDocRef = doc(db, metadataPath, fileId);
    const fileDoc = await getDoc(fileDocRef);

    if (fileDoc.exists()) {
      return { success: true, file: { id: fileDoc.id, ...fileDoc.data() } };
    } else {
      return { success: false, error: "File not found" };
    }
  } catch (error) {
    console.error("Error getting file metadata:", error);
    return { success: false, error: error.message };
  }
};
