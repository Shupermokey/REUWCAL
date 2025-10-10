import React from "react";
import { slide as Menu } from "react-burger-menu";
import { useApp } from "../app/providers/AppProvider";
import Logout from "../features/auth/Auth/Logout";
import { useDrop } from "react-dnd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";

function Sidebar() {
  const { showFilePanel, setShowFilePanel } = useApp();
  const { user, subscription, tier } = useAuth();
  const navigate = useNavigate();

  const tierColors = {
    price_1Qsv7uEgiGJZMTseYDbIe3L5: "#ccc",
    price_1Qsv8DEgiGJZMTseaDY7IXHY: "#2aa198",
    price_1Qsv8YEgiGJZMTsedR1y1jfF: "#268bd2",
    price_1Qsv8pEgiGJZMTse04hQCTMM: "#d33682",
  };

  return (
    <>
      {/* Left Burger Menu */}
      <Menu noOverlay className="left">
        <div
          style={{
            padding: "0.5rem 1rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>👤 Logged in</span>
          <span
            style={{
              backgroundColor: tierColors[subscription] || "#eee",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "8px",
              textTransform: "capitalize",
            }}
          >
            {tier}
          </span>
        </div>

        <button onClick={() => navigate("/profile")}>Profile</button>
        <button onClick={() => navigate("/home")}>Home</button>
        <button onClick={() => navigate("/baseline")}>Baseline</button>
        <button onClick={() => navigate("/pricing")}>Pricing</button>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>

        {/* Move this out of the .bm-menu */}
        <button
          onClick={() => setShowFilePanel(!showFilePanel)}
          className="file-btn"
        >
          📁 Files
        </button>
        <Logout />
      </Menu>
    </>
  );
}

export default Sidebar;
