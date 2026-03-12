import React from 'react';
import { Navbar, Container, Button, Badge } from 'react-bootstrap';
import { FaBars, FaBell } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getPublicImageUrl } from '../../lib/requestApi';

const TopBar = ({ toggleSidebar }) => {

  const { profile, user } = useSelector((state) => state.userProfile);

  const location = useLocation();

  // Dynamic Header Logic
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/profile')) {
      return {
        title: 'Profile Management',
        description: 'Manage your pharmacy details and account settings.'
      };
    }
    if (path.includes('/dashboard/inventory/setup')) {
      return {
        title: 'Inventory Setup',
        description: 'Manage manufacturers and suppliers for your pharmacy.'
      };
    }
    if (path.includes('/dashboard/inventory/drugs')) {
      return {
        title: 'Drug Catalog',
        description: 'View and manage your pharmacy\'s drug database.'
      };
    }
    if (path.includes('/dashboard/inventory/stock')) {
      return {
        title: 'Stock Management',
        description: 'Track inventory batches, expiry dates, and stock levels.'
      };
    }
    if (path.includes('/dashboard/orders')) {
      return {
        title: 'Order Management',
        description: 'Track and manage customer medications orders.'
      };
    }
    return {
      title: 'Dashboard',
      description: 'Welcome to your pharmacy inventory system.'
    };
  };

  const { title, description } = getHeaderInfo();

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

  const initials = getInitials(profile?.pharmacy_name);

  return (
    <Navbar bg="white" className="shadow-sm sticky-top px-3 py-2 border-bottom" style={{ zIndex: 900 }}>
      <Container fluid className="align-items-center">
        {/* Mobile Toggle */}
        <Button variant="link" className="d-lg-none me-3 text-dark p-0" onClick={toggleSidebar}>
          <FaBars size={24} />
        </Button>

        {/* Dynamic Header */}
        <div className="d-flex flex-column justify-content-center">
          <h5 className="mb-0 fw-bold text-dark" style={{ fontFamily: 'Sora' }}>{title}</h5>
          <small className="text-muted d-none d-sm-block" style={{ fontSize: '0.85rem' }}>{description}</small>
        </div>

        {/* Right Side Actions */}
        <div className="ms-auto d-flex align-items-center gap-3">
          <Badge 
            pill 
            bg={profile?.is_approved ? 'success' : 'warning'} 
            className={profile?.is_approved ? 'px-3' : 'px-3 text-dark'}
            style={{ fontSize: '0.75rem', fontWeight: '600' }}
          >
            {profile?.is_approved ? 'Approved' : 'Pending Approval'}
          </Badge>

          {/* User Avatar or Initials */}
          <div className="d-flex align-items-center gap-2">
            {profile?.profile_img ? (
              <img 
                src={getPublicImageUrl({ path: profile.profile_img, bucket_name: 'user_profiles' })} 
                alt="Pharmacy" 
                className="rounded-circle border"
                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
              />
            ) : (
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  backgroundColor: '#7B3FE4', 
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default TopBar;
