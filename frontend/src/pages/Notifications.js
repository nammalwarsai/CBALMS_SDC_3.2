import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Card, Button, Spinner } from 'react-bootstrap';
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
      <Sidebar user={user} onLogout={handleLogout} isAdmin={isAdmin} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
        <Container fluid className={`mt-4 px-4 pb-4 dashboard-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {/* Header */}
          <div className="dashboard-header mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h2><i className="bi bi-bell me-2"></i>Notifications</h2>
                <p className="text-muted mb-0">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
                </p>
              </div>
              <div className="mt-3 mt-md-0 d-flex gap-2 align-items-center">
                <ThemeToggle />
                {unreadCount > 0 && (
                  <Button variant="outline-primary" onClick={handleMarkAllRead}>
                    <i className="bi bi-check2-all me-1"></i>Mark All as Read
                  </Button>
                )}
                <Button variant="outline-secondary" onClick={() => navigate(isAdmin ? '/admin-dashboard' : '/employee-dashboard')}>
                  <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <Card className="content-card">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: '#9CA3AF' }}></i>
                  <h5 className="mt-3 text-muted">No notifications yet</h5>
                  <p className="text-muted">When you receive notifications, they will appear here.</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`d-flex align-items-start gap-3 p-3 border-bottom notification-page-item ${!notification.is_read ? 'notification-page-unread' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: '42px', height: '42px', background: 'rgba(79, 70, 229, 0.08)' }}
                        >
                          <i className={`bi ${getNotificationIcon(notification.type)}`} style={{ fontSize: '1.2rem' }}></i>
                        </div>
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h6 className={`mb-1 ${!notification.is_read ? 'fw-bold' : 'fw-semibold'}`} style={{ fontSize: '0.95rem' }}>
                              {notification.title}
                              {!notification.is_read && (
                                <span className="bg-primary rounded-circle d-inline-block ms-2" style={{ width: '8px', height: '8px', verticalAlign: 'middle' }}></span>
                              )}
                            </h6>
                            <p className="text-muted mb-1" style={{ fontSize: '0.9rem', wordWrap: 'break-word' }}>
                              {notification.message}
                            </p>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {formatTimeAgo(notification.created_at)}
                            </small>
                          </div>
                          {!notification.is_read && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="ms-3 flex-shrink-0"
                              onClick={() => handleMarkAsRead(notification.id)}
                              style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                            >
                              <i className="bi bi-check2 me-1"></i>Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center py-3">
                      <Button
                        variant="outline-primary"
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
                            <i className="bi bi-arrow-down-circle me-1"></i>Load More
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
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
