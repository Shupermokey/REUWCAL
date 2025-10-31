import React from "react";
import { slide as Menu } from "react-burger-menu";

import { useDrop } from "react-dnd";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppProvider";
import Logout from "@/features/auth/Auth/Logout";
import { useAuth } from "@/app/providers/AuthProvider";

//CSS
import "@/styles/components/Sidebar.css";

function Sidebar() {
  const {tier,showSidebar, setShowSidebar  } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className={showSidebar ? "sidebar-show" : "sidebar-hidden"} onClick={() => {setShowSidebar(!showSidebar)}}>
        |||
      </div>
      <Menu noOverlay className="sidebar">
        <div className="sidebar__header">
          <span>
            Tier: {tier}
          </span>
        </div>

        <button onClick={() => navigate("/profile")}>Profile</button>
        <button onClick={() => navigate("/home")}>Home</button>
        <button onClick={() => navigate("/baseline")}>Baseline</button>
        <button onClick={() => navigate("/pricing")}>Pricing</button>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>

        <Logout />
      </Menu>
    </>
  );
}

export default Sidebar;
