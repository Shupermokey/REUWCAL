import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - Loading:", loading);

  if (loading) {
    return <div>Loading...</div>
  }
  return user ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
