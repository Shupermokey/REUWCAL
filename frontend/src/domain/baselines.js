import {
  getBaselines,
  getBaseline,
  saveBaseline,
  deleteBaseline,
} from "@/services/firestore/baselinesService";

/**
 * Fetch all baselines for user.
 */
export async function loadBaselines(uid) {
  return await getBaselines(uid);
}

/**
 * Fetch single baseline by ID.
 */
export async function loadBaseline(uid, baselineId) {
  return await getBaseline(uid, baselineId);
}

/**
 * Save or update baseline data.
 */
export async function saveBaselineData(uid, baselineId, data) {
  await saveBaseline(uid, baselineId, data);
}

/**
 * Delete baseline.
 */
export async function removeBaseline(uid, baselineId) {
  await deleteBaseline(uid, baselineId);
}
