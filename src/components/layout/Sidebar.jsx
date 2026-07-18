import React from 'react';
import { Nav, Button, Offcanvas, Image, Badge } from 'react-bootstrap';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaUserMd, FaSignOutAlt, FaBoxOpen, FaPills, FaBoxes, FaShoppingBasket, FaFirstOrder } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/uiContextBase';
import { useBadgeCounts } from '../../context/BadgeCountsContext';
import { TbMoneybag } from "react-icons/tb";
import { getPublicImageUrl } from '../../lib/requestApi';

const Sidebar = ({ show, onHide }) => {
  const { logoutHandler } = useAuth();
  const { showAlert } = useUi();
  const { counts } = useBadgeCounts();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useSelector((state) => state.userProfile);
  const isIframeMode = sessionStorage.getItem('isIframeMode') === 'true';

  const getInitials = (name) => {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (name.length > 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (name[0] + name[0]).toUpperCase();
  };

  const initials = getInitials(profile?.pharmacy_name || "PH");

  const handleLogout = async () => {
    try {
      await logoutHandler();
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

  const navContent = (
    <div className="d-flex flex-column h-100 pt-4">
      <div className="mb-4 px-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          {profile?.profile_img ? (
            <Image src={getPublicImageUrl({ path: profile.profile_img, bucket_name: 'user_profiles' })} alt={profile?.pharmacy_name || "Pharmacy"} width="40" height="40" className="bg-white rounded-circle p-1" style={{ objectFit: 'cover' }} />
          ) : (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm bg-white"
              style={{
                width: '40px',
                height: '40px',
                color: '#7B3FE4',
                fontSize: '1rem',
                flexShrink: 0
              }}
            >
              {initials}
            </div>
          )}
          <span className="text-white fw-bold fs-5 text-truncate" style={{ fontFamily: 'Sora' }}>{profile?.pharmacy_name || "Pharmacy"}</span>
        </div>
      </div>

      <Nav className="flex-column flex-grow-1 px-2">
        <NavLink to="/dashboard/profile" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaUserMd className="me-3" size={18} /> Profile
        </NavLink>

        <div className="mt-4 mb-2 px-3 text-white-50 small text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>Inventory</div>

        <NavLink to="/dashboard/inventory/stock" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaBoxes className="me-3" size={18} /> Stock & Batches
        </NavLink>

        <NavLink to="/dashboard/inventory/catalog" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaPills className="me-3" size={18} /> Inventory Catalog
        </NavLink>


        <NavLink to="/dashboard/inventory/setup" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <FaBoxOpen className="me-3" size={18} /> Configuration
        </NavLink>

        <NavLink to="/dashboard/orders" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <div className="d-flex align-items-center w-100">
            <TbMoneybag className="me-3" size={18} />
            <span>Orders</span>
            {counts?.orders > 0 && (
              <Badge bg="danger" pill className="ms-auto">{counts.orders}</Badge>
            )}
          </div>
        </NavLink>

        <div className="mt-4 mb-2 px-3 text-white-50 small text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>Hospital</div>

        <NavLink to="/dashboard/hospital-queue" style={navLinkStyle} onClick={() => onHide && onHide()}>
          <div className="d-flex align-items-center w-100">
            <FaFirstOrder className="me-3" size={18} />
            <span>Hospital Queue</span>
            {counts?.queue > 0 && (
              <Badge bg="danger" pill className="ms-auto">{counts.queue}</Badge>
            )}
          </div>
        </NavLink>

        <div className='mb-3'>
          <div className="mt-4 mb-2 px-3 text-white-50 small text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>Market-Place</div>
          <div className="px-3 text-white-50 small fw-bold" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>
            You can list your <b>non-medical products</b> in our Marketplace.
          </div>
        </div>

        <NavLink style={navLinkStyle} onClick={() => {
          window.open("https://product-inventory.lavendercare.co/", "_blank")
          onHide && onHide()
        }}>
          <TbMoneybag className="me-3" size={18} /> Products
        </NavLink>
      </Nav>

      <div className="mt-auto px-3 pb-4">
        {isIframeMode ? (
          <Button
            variant="danger"
            className="w-100 d-flex align-items-center justify-content-center"
            style={{ padding: '0.6rem' }}
            onClick={() => window.parent.postMessage({ type: 'EXIT_PHARMACY_IFRAME' }, '*')}
          >
            <FaSignOutAlt className="me-3" /> Exit Pharmacy
          </Button>
        ) : (
          <Button
            variant="outline-light"
            className="w-100 d-flex align-items-center justify-content-center border-0 opacity-75 hover-opacity-100"
            style={{ padding: '0.6rem', transition: 'all 0.2s' }}
            onClick={handleLogout}
          >
            <FaSignOutAlt className="me-3" /> Logout
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="d-none d-lg-flex flex-column position-fixed start-0 top-0 bottom-0 shadow-sm" style={{ overflowY: 'auto', width: '260px', zIndex: 1000, backgroundColor: '#7B3FE4' }}>
        {navContent}
      </div>

      {/* Mobile Offcanvas */}
      <Offcanvas show={show} onHide={onHide} responsive="lg" className="d-lg-none" style={{ backgroundColor: '#7B3FE4', color: 'white', width: '280px' }}>
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white fw-bold">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {navContent}
        </Offcanvas.Body>
      </Offcanvas>
    </>

  );
};

export default Sidebar;
