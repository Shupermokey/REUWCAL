import React, { useState } from "react";
import { loginUser } from "../../firebase/authService";
import { handleSignInWithEmailAndPassword, handleSignInWithGoogle } from "../../firebase/authService";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const Login = () => {

  const {userLoggedIn} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate(); //Navigation Hook?

  const handleLogin = async (e) => {
    e.preventDefault();
    // try {
    //   const user = await loginUser(email, password);
    //   console.log("User logged in:", user);
    // } catch (error) {
    //   console.error("Login failed:", error.message);
    // }
    try {
      if(!isSigningIn) {
        setIsSigningIn(true);
        await handleSignInWithEmailAndPassword(email, password);
      }
      navigate("/home");
    }
    catch (err) {
      console.log("error")
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
    <form className="login-form" onSubmit={handleLogin}>
      <input
        className="email-login-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="pass-login-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="login-btn" type="submit">Login</button>
    </form>
  );
};

export default Login;
