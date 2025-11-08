import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logout from "@/features/auth/Auth/Logout";
import { useAuth } from "@/app/providers/AuthProvider";
import { useSubscription } from "@/app/providers/SubscriptionProvider";

//CSS
import "@/styles/components/Sidebar.css";

function Sidebar() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false); // Close sidebar after navigation
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Close Button */}
        <button
          className="sidebar-close"
          onClick={toggleSidebar}
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Sidebar Header */}
        <div className="sidebar__header">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-email">{user?.email || 'Guest'}</div>
              <div className="sidebar__user-tier">{tier || 'Free'} Plan</div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar__nav">
          <button
            className="sidebar__link"
            onClick={() => handleNavigate("/home")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </button>

          <button
            className="sidebar__link"
            onClick={() => handleNavigate("/baseline")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            <span>Baseline</span>
          </button>

          <button
            className="sidebar__link"
            onClick={() => handleNavigate("/dashboard")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            className="sidebar__link"
            onClick={() => handleNavigate("/pricing")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="12" y1="2" x2="12" y2="6" />
            </svg>
            <span>Pricing</span>
          </button>

          <button
            className="sidebar__link"
            onClick={() => handleNavigate("/profile")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        {/* Logout Button */}
        <div className="sidebar__footer">
          <Logout />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
