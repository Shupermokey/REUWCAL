import React, { useState } from "react";
import { loginUser } from "../../firebase/authService";
import { handleSignInWithEmailAndPassword, handleSignInWithGoogle } from "../../firebase/authService";
import { useAuth } from "../../context/AuthProvider";

const Login = () => {

  const {userLoggedIn} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // try {
    //   const user = await loginUser(email, password);
    //   console.log("User logged in:", user);
    // } catch (error) {
    //   console.error("Login failed:", error.message);
    // }
    if(!isSigningIn) {
      setIsSigningIn(true);
      await handleSignInWithEmailAndPassword(email, password);
    }
  };


  const handleGoogleSignIn = (e) => {
    e.preventDefault()
    if(!isSigningIn) {
        setIsSigningIn(true);
        handleSignInWithGoogle().catch(err => {
          setIsSigningIn(false);
        })
    }
  }


  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
