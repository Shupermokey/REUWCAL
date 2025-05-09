import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";

const ProtectedRoute = ({ children, allowedTiers = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;

  // 🔐 Tier enforcement
  const tier = user.subscriptionTier || "free"; // fallback
  if (allowedTiers.length > 0 && !allowedTiers.includes(tier)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
