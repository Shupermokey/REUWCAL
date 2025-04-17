import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

const functions = getFunctions(getApp());

// ✅ Accept a destructured object
export const deleteFolder = async ({ userId, propertyId, folderPath }) => {
  const recursiveDeleteFolder = httpsCallable(functions, "recursiveDeleteFolder");

  // ✅ Payload will now be correctly shaped
  const result = await recursiveDeleteFolder({ userId, propertyId, folderPath });
  return result.data;
};

