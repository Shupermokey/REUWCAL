import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page" style={{ padding: "2rem", textAlign: "center" }}>
      <h1>🚫 Access Denied</h1>
      <p>You do not have the required subscription tier to access this page.</p>
      <button onClick={() => navigate("/pricing")}>Upgrade My Plan</button>
    </div>
  );
};

export default Unauthorized;
