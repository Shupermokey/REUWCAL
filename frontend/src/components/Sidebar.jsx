import React, { useState } from "react";
import { slide as Menu } from "react-burger-menu";
import { useApp } from "../context/AppProvider";
import Logout from "./Auth/Logout";
import FileExplorer from "./Sidebar/FileSystem/FileExplorer";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function Sidebar() {
  const { base, setBase } = useApp();
  const { selectedPropertyId, showFilePanel, setShowFilePanel } = useApp();

  function FileDropZone({ onFileDropped, children }) {
    const [, drop] = useDrop({
      accept: "file", // custom type
      drop: (item, monitor) => {
        const file = monitor.getItem().file;
        if (file) onFileDropped(file);
      },
    });

    return <div ref={drop}>{children}</div>;
  }

  return (
    <>
      {/* Left Burger Menu */}
      <Menu noOverlay className="left">
        <a href="/profile">Profile</a>
        <a href="/home">Home</a>
        <a href="/baseline">Basic</a>
        <a href="/pricing">Pricing</a>
        <a href="/dashboard">Dash</a>

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
