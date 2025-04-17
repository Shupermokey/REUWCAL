import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - Loading:", loading);

  if (loading) {
    return <div>Loading...</div>;
}

if (!user) return <Navigate to="/" />;

if (!user.emailVerified) return <Navigate to="/verify-email" />;

return children;
};

export default ProtectedRoute;
