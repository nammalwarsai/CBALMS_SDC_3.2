import React, { useContext, useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import ConfirmDialog from '../common/ConfirmDialog';
import BackToTop from '../common/BackToTop';

const EmployeeLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});

  const handleLogout = useCallback(() => {
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
  }, [logout, navigate]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className="d-flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isAdmin={false}
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />

      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
        <Container
          fluid
          className={`mt-4 px-4 pb-4 dashboard-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        >
          <Outlet />
        </Container>
      </div>

      <BackToTop />

      <ConfirmDialog
        show={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        onConfirm={confirmAction || (() => {})}
        {...confirmConfig}
      />
    </div>
  );
};

export default EmployeeLayout;
