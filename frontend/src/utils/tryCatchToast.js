// src/utils/tryCatchToast.js
import toast from "react-hot-toast";

/**
 * Wraps async calls with toast success/error messages.
 * @param {Promise} promise - the async action
 * @param {string} successMsg - toast message on success
 * @param {string} errorMsg - toast message on failure
 */
export const tryCatchToast = async (promise, successMsg, errorMsg) => {
  try {
    const result = await promise;
    if (successMsg) toast.success(successMsg);
    return result;
  } catch (err) {
    toast.error(errorMsg || err.message || "Something went wrong");
    console.error(err);
    throw err;
  }
};
