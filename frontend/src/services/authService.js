// authService.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updatePassword, sendEmailVerification } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";


// Register User
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential; // This should contain a "user" property
  } catch (error) {
    console.error("Error registering user:", error.message);
    throw error; // Propagate the error so it can be handled by the calling code
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
  try {
    const result = await signInWithPopup(auth, googleProvider);
  return result;
  }
  catch(err){
    console.log(err)
  }
};

export const handleSignOut = () => {
  return auth.signOut();
}