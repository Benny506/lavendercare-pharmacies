import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <div className="d-flex" style={{ height: '100vh' }}>
      {/* Sidebar - Desktop Fixed / Mobile Offcanvas */}
      <Sidebar show={showSidebar} onHide={toggleSidebar} />

      {/* Main Content */}
      <div className="d-flex flex-column flex-grow-1" style={{ marginLeft: '260px', overflowX: 'hidden' }}>
        {/* Top Bar - Fixed */}
        <TopBar toggleSidebar={toggleSidebar} />

        {/* Scrollable Content Region */}
        <div className="flex-grow-1 bg-light p-4" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </div>
      </div>

      {/* Mobile Responsive Adjustments */}
      <style>{`
        @media (max-width: 991.98px) {
          .d-flex.flex-column.flex-grow-1 {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
