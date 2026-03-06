import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      // Silently fail - notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <OverlayTrigger placement="bottom" overlay={<Tooltip>Notifications</Tooltip>}>
      <Button
        variant="outline-secondary"
        onClick={() => navigate('/notifications')}
        className="d-flex align-items-center justify-content-center position-relative"
        aria-label="Notifications"
        style={{ width: '42px', height: '42px', borderRadius: '50%' }}
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute"
            style={{ top: '-2px', right: '-2px', fontSize: '0.6rem', minWidth: '18px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    </OverlayTrigger>
  );
};

export default NotificationBell;
