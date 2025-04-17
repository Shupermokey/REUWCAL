import FileExplorer from "./FileExplorer";
import '../../../styles/FileSystemSidebar.css'

export default function FileSystemSidebar({ propertyId, isOpen, onClose }) {
    if (!isOpen) return null;
  
    return (
      <div className="sidebar-overlay">
        <div className="sidebar-content">
          <button onClick={onClose}>❌ Close</button>
          <FileExplorer propertyId={propertyId} />
        </div>
      </div>
    );
  }
  