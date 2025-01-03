// authService.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updatePassword, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebaseConfig";

// Register User
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error.message);
    throw error;
  }
};

// Log In User
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in user:", error.message);
    throw error;
  }
};

// Log Out User
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Error logging out:", error.message);
    throw error;
  }
};



export const handleCreateUserWithEmailAndPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const handleSignInWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const handleSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  //result.user
  return result;
};

export const handleSignOut = () => {
  return auth.signOut();
}

// export const handlePasswordReset = (email) => {
//   return sendPasswordResetEmail(auth, email);
// }

// export const handlePasswordChange = (password) => {
//   return updatePassword(auth.currentUser, password);
// }

// export const handleSendEmailVerification = () => {
//   return sendEmailVerification(auth.currentUser, {
//     url: `${window.location.origin}/home`,
//   });
// }