import React from 'react';
import { Nav, Button, Offcanvas, Image } from 'react-bootstrap';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaUserMd, FaSignOutAlt, FaBoxOpen, FaPills, FaBoxes, FaShoppingBasket, FaFirstOrder } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/uiContextBase';
import { TbMoneybag } from "react-icons/tb";

const Sidebar = ({ show, onHide }) => {
  const { logout } = useAuth();
  const { showAlert } = useUi();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      showAlert('success', 'Logged out successfully');
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      showAlert('error', 'Failed to logout');
    }
  };

  const navLinkStyle = ({ isActive }) => ({
    backgroundColor: isActive ? 'white' : 'transparent',
    color: isActive ? '#7B3FE4' : 'rgba(255,255,255,0.8)',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '0.5rem',
    textDecoration: 'none'
  });

  const NavContent = () => (
    <div className="d-flex flex-column h-100 pt-4">
      <div className="mb-4 px-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Image src="/logo.svg" alt="LavenderCare" width="40" height="40" className="bg-white rounded-circle p-1" />
          <span className="text-white fw-bold fs-5" style={{ fontFamily: 'Sora' }}>LavenderCare</span>
        </div>
        <small className="text-white-50 ms-1">Pharmacy Portal</small>
      </div>

      <Nav className="flex-column flex-grow-1 px-2">
        <NavLink to="/dashboard/profile" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaUserMd className="me-3" size={18} /> Profile
        </NavLink>
        
        <div className="mt-4 mb-2 px-3 text-white-50 small text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>Inventory</div>
        
        <NavLink to="/dashboard/inventory/stock" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaBoxes className="me-3" size={18} /> Stock & Batches
        </NavLink>
        
        <NavLink to="/dashboard/inventory/drugs" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaPills className="me-3" size={18} /> Drug Catalog
        </NavLink>
        
        <NavLink to="/dashboard/inventory/setup" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaBoxOpen className="me-3" size={18} /> Configuration
        </NavLink>

        <NavLink to="/dashboard/orders" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <TbMoneybag className="me-3" size={18} /> Orders
        </NavLink>        
      </Nav>

      <div className="mt-auto px-2 mb-3">
        <Button 
          variant="link" 
          className="text-white text-decoration-none d-flex align-items-center w-100 px-3 py-2 rounded hover-bg-white-10"
          onClick={handleLogout}
          style={{ transition: 'all 0.2s' }}
        >
          <FaSignOutAlt className="me-3" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="d-none d-lg-flex flex-column position-fixed start-0 top-0 bottom-0 shadow-sm" style={{ width: '260px', zIndex: 1000, backgroundColor: '#7B3FE4' }}>
        <NavContent />
      </div>

      {/* Mobile Offcanvas */}
      <Offcanvas show={show} onHide={onHide} responsive="lg" className="d-lg-none" style={{ backgroundColor: '#7B3FE4', color: 'white', width: '280px' }}>
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white fw-bold">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <NavContent />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
