import React, { useState } from "react";
import FileExplorer from "./FileSystem/FileExplorer";
import '../../styles/Sidebar.css'

const PropertyFileSidebar = ({ isOpen, onClose, propertyId }) => {
  if (!isOpen || !propertyId) return null;

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h2>📁 Property Files</h2>
          <button onClick={onClose}>❌</button>
        </div>
        {console.log("Sidebar mounted with propertyId:", propertyId)}
        <div className="sidebar-body">
          <FileExplorer propertyId={propertyId} />
        </div>
      </div>
    </div>
  );
};

export default PropertyFileSidebar;
