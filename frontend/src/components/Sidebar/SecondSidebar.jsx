import React from 'react';
import './RightPanel.css';

const SecondSidebar = ({ isOpen, onClose, children }) => {
  return (
    <div className={`right-panel ${isOpen ? 'open' : ''}`}>
      <div className="right-panel-header">
        <button onClick={onClose}>Close</button>
      </div>
      <div className="right-panel-content">
        {children}
      </div>
    </div>
  );
};

export default SecondSidebar;
