import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import ThemeToggle from '../components/common/ThemeToggle';
import ConfirmDialog from '../components/common/ConfirmDialog';
import notificationService from '../services/notificationService';
import useToast from '../hooks/useToast';

const Notifications = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});

  const LIMIT = 20;

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await notificationService.getNotifications(pageNum, LIMIT);
      const data = response.data?.notifications || [];

      if (append) {
        setNotifications(prev => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setHasMore(data.length === LIMIT);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(1);
      fetchUnreadCount();
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = () => {
    setConfirmConfig({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      variant: 'danger',
      icon: 'bi-box-arrow-right'
    });
    setConfirmAction(() => () => {
      logout();
      navigate('/login');
    });
    setShowConfirmDialog(true);
  };

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

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

  return (
    <div className="d-flex">
      <Sidebar user={user} onLogout={handleLogout} isAdmin={isAdmin} collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
        <Container fluid className={`mt-4 px-4 pb-4 dashboard-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {/* Premium Header */}
          <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
            <div>
              <h2 className="ds-title text-primary fw-bold"><i className="bi bi-bell-fill fs-3 me-2"></i>Notifications</h2>
              <p className="text-muted mb-0 ds-subtitle">
                {unreadCount > 0 ? (
                  <span className="text-dark fw-medium text-opacity-75">You have <Badge bg="danger" className="rounded-pill fs-6 px-2">{unreadCount}</Badge> unread notifications</span>
                ) : (
                  <span><i className="bi bi-check2-circle text-success me-1"></i>You're all caught up!</span>
                )}
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <ThemeToggle />
              {unreadCount > 0 && (
                <Button variant="light" className="premium-badge text-primary border-0 bg-primary bg-opacity-10 shadow-sm" onClick={handleMarkAllRead}>
                  <i className="bi bi-check2-all fs-6 me-1"></i>Mark All Read
                </Button>
              )}
              <Button variant="light" className="premium-badge text-secondary border-0 bg-white shadow-sm" onClick={() => navigate(isAdmin ? '/admin-dashboard' : '/employee-dashboard')}>
                <i className="bi bi-arrow-left fs-6 me-1"></i>Dashboard
              </Button>
            </div>
          </div>

          {/* Timeline List */}
          <div className="position-relative">
            {/* Vertical Line */}
            {notifications.length > 0 && !loading && (
              <div className="position-absolute bg-primary bg-opacity-25" style={{ left: '26px', top: '10px', bottom: '10px', width: '2px', zIndex: 0 }}></div>
            )}
            
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="grow" variant="primary" />
                <p className="text-muted mt-3 fw-medium">Loading your notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 bg-white bg-opacity-50 rounded-4 border border-secondary border-opacity-25 shadow-sm">
                <i className="bi bi-bell-slash opacity-25 text-primary mb-3 d-inline-block" style={{ fontSize: '4.5rem' }}></i>
                <h4 className="text-dark fw-bold">No Notifications Yet</h4>
                <p className="text-muted">When you have updates or alerts, they will show up here.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`position-relative z-index-1 d-flex align-items-start gap-4 p-4 rounded-4 shadow-sm border transition-all ${!notification.is_read ? 'bg-white border-primary border-opacity-50' : 'bg-light bg-opacity-50 border-secondary border-opacity-10'}`}
                    style={{ 
                      animation: `tableSlideUp ${0.3 + (index * 0.05)}s ease-out both`
                    }}
                  >
                    <div className="flex-shrink-0 mt-1 position-relative">
                      {!notification.is_read && <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"><span className="visually-hidden">Unread</span></span>}
                      <div
                        className={`d-flex align-items-center justify-content-center rounded-circle border border-white shadow-sm`}
                        style={{ width: '52px', height: '52px', background: !notification.is_read ? '#fff' : 'var(--ds-surface-muted)' }}
                      >
                        <i className={`bi ${getNotificationIcon(notification.type)}`} style={{ fontSize: '1.4rem' }}></i>
                      </div>
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h6 className={`mb-2 ${!notification.is_read ? 'fw-bold text-dark' : 'fw-semibold text-muted'}`} style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                            {notification.title}
                          </h6>
                          <p className={`mb-3 ${!notification.is_read ? 'text-secondary' : 'text-muted text-opacity-75'}`} style={{ fontSize: '0.95rem', wordWrap: 'break-word', lineHeight: '1.5' }}>
                            {notification.message}
                          </p>
                          <div className="d-flex align-items-center gap-3">
                            <span className="premium-badge secondary border-0 bg-secondary bg-opacity-10 text-muted" style={{ padding: '0.35rem 0.75rem' }}>
                              <i className="bi bi-clock me-1"></i>
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="light"
                            size="sm"
                            className="premium-badge border border-primary border-opacity-25 text-primary bg-white bg-opacity-75 shadow-sm mt-2 mt-sm-0"
                            onClick={() => handleMarkAsRead(notification.id)}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <i className="bi bi-check2-circle fs-6 me-1"></i>Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center py-4 mt-2 position-relative z-index-1">
                    <Button
                      variant="primary"
                      className="rounded-pill px-4 shadow py-2 fw-bold"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-down-circle-fill me-2 fs-6"></i>Load Older Notifications
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </div>

      <ConfirmDialog
        show={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        onConfirm={confirmAction || (() => { })}
        {...confirmConfig}
      />
    </div>
  );
};

export default Notifications;
