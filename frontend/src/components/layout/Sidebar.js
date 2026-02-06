import React, { useState } from 'react';
import { Nav, Button, Offcanvas } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { getInitials } from '../../utils/helpers';

const Sidebar = ({ user, onLogout, isAdmin = false, collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobile, setShowMobile] = useState(false);

  const employeeLinks = [
    { path: '/employee-dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/profile', icon: 'bi-person', label: 'My Profile' },
  ];

  const adminLinks = [
    { path: '/admin-dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/profile', icon: 'bi-person', label: 'My Profile' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const handleNav = (path) => {
    navigate(path);
    setShowMobile(false);
  };

  const SidebarContent = () => (
    <div className="sidebar-content d-flex flex-column h-100">
      {/* User Info */}
      <div className="sidebar-user-info text-center p-3 mb-2">
        <div className="sidebar-avatar mx-auto mb-2">
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt="Profile" className="rounded-circle" style={{ width: 60, height: 60, objectFit: 'cover' }} />
          ) : (
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
              style={{ 
                width: 60, height: 60, 
                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                color: 'white', fontSize: '1.2rem', fontWeight: 700
              }}
            >
              {getInitials(user?.name)}
            </div>
          )}
        </div>
        <h6 className="mb-0 fw-bold">{user?.name || 'User'}</h6>
        <small className="text-muted">{isAdmin ? 'Administrator' : 'Employee'}</small>
      </div>

      <hr className="mx-3 my-1" />

      {/* Navigation Links */}
      <Nav className="flex-column px-2 flex-grow-1">
        {links.map((link) => (
          <Nav.Link
            key={link.path}
            className={`sidebar-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 mb-1 ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => handleNav(link.path)}
            aria-label={link.label}
          >
            <i className={`bi ${link.icon}`}></i>
            <span>{link.label}</span>
          </Nav.Link>
        ))}
      </Nav>

      {/* Logout */}
      <div className="p-3 mt-auto">
        <Button 
          variant="outline-danger" 
          className="w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={onLogout}
          aria-label="Logout"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Log Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Toggle Button - shown when sidebar is collapsed */}
      {collapsed && onToggle && (
        <Button
          variant="light"
          className="position-fixed d-none d-lg-flex align-items-center justify-content-center"
          style={{
            top: '1rem', left: '1rem', zIndex: 1051,
            width: '42px', height: '42px', borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            border: '1px solid #E5E7EB'
          }}
          onClick={onToggle}
          aria-label="Open sidebar"
        >
          <i className="bi bi-list" style={{ fontSize: '1.3rem' }}></i>
        </Button>
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="primary"
        className="sidebar-toggle d-lg-none position-fixed"
        style={{ top: '1rem', left: '1rem', zIndex: 1050 }}
        onClick={() => setShowMobile(true)}
        aria-label="Toggle navigation menu"
      >
        <i className="bi bi-list"></i>
      </Button>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas
        show={showMobile}
        onHide={() => setShowMobile(false)}
        className="d-lg-none sidebar-offcanvas"
        style={{ width: '260px' }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold">
            <i className="bi bi-cloud-check me-2 text-primary"></i>CBALMS
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Desktop Sidebar */}
      <div className="sidebar-desktop d-none d-lg-flex flex-column" style={{
        width: '250px',
        minHeight: '100vh',
        background: 'white',
        borderRight: '1px solid #E5E7EB',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease'
      }}>
        {/* Brand with toggle */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-cloud-check me-2 text-primary"></i>CBALMS
          </h5>
          {onToggle && (
            <Button
              variant="link"
              className="p-0 text-dark"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              style={{ fontSize: '1.3rem', lineHeight: 1 }}
            >
              <i className="bi bi-list"></i>
            </Button>
          )}
        </div>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
