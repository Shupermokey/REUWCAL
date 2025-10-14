import { getBaselines, getBaseline, saveBaseline, deleteBaseline } from "@/services/firestore/baselinesService";

export const fetchBaselines = async (uid) => await getBaselines(uid);
export const fetchBaselineById = async (uid, id) => await getBaseline(uid, id);
export const saveBaselineData = async (uid, id, data) => await saveBaseline(uid, id, data);
export const removeBaseline = async (uid, id) => await deleteBaseline(uid, id);

export const getBaselineShape = () => ({
  name: "",
  rows: [],
  createdAt: null,
});
