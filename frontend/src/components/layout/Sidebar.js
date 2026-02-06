import React, { useState, useEffect, useCallback } from 'react';
import { Nav, Button, Offcanvas, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { getInitials } from '../../utils/helpers';
import notificationService from '../../services/notificationService';

const Sidebar = ({ user, onLogout, isAdmin = false, collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobile, setShowMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      // Silently fail - notifications are non-critical
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications(1, 10);
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const handleNotificationClick = async () => {
    if (!showNotifications) {
      await fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      // Silently fail
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (error) {
      // Silently fail
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request': return 'bi-envelope-paper text-primary';
      case 'leave_approved': return 'bi-check-circle text-success';
      case 'leave_rejected': return 'bi-x-circle text-danger';
      case 'attendance': return 'bi-clock text-info';
      default: return 'bi-bell text-secondary';
    }
  };

  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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

  const NotificationBell = () => (
    <Dropdown show={showNotifications} onToggle={handleNotificationClick} align="end" className="mb-2">
      <Dropdown.Toggle
        variant="link"
        className="sidebar-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-decoration-none position-relative w-100"
        style={{ color: 'inherit', border: 'none' }}
        aria-label="Notifications"
      >
        <i className="bi bi-bell"></i>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <Badge bg="danger" pill className="ms-auto" style={{ fontSize: '0.7rem' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="p-0 text-primary" onClick={handleMarkAllRead} style={{ fontSize: '0.75rem' }}>
              Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-bell-slash" style={{ fontSize: '1.5rem' }}></i>
            <p className="mb-0 mt-2" style={{ fontSize: '0.85rem' }}>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <Dropdown.Item
              key={notification.id}
              className={`d-flex gap-2 py-2 px-3 ${!notification.is_read ? 'bg-light' : ''}`}
              style={{ whiteSpace: 'normal', fontSize: '0.85rem' }}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            >
              <i className={`bi ${getNotificationIcon(notification.type)} mt-1`} style={{ fontSize: '1rem' }}></i>
              <div className="flex-grow-1">
                <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>{notification.title}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{notification.message}</div>
                <small className="text-muted">{formatTimeAgo(notification.created_at)}</small>
              </div>
              {!notification.is_read && (
                <span className="align-self-center">
                  <span className="bg-primary rounded-circle d-inline-block" style={{ width: '8px', height: '8px' }}></span>
                </span>
              )}
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );

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
            style={{ color: '#000' }}
          >
            <i className={`bi ${link.icon}`}></i>
            <span>{link.label}</span>
          </Nav.Link>
        ))}
        <NotificationBell />
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
