import React, { useContext, useState } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import useToast from '../hooks/useToast';

const SETTINGS_KEY = 'cbalms_user_settings';

const defaultSettings = {
  emailNotifications: true,
  leaveAlerts: true,
  attendanceReminders: true,
  holidayAlerts: true,
  compactTables: false,
  defaultExportFormat: 'pdf',
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return { ...defaultSettings };
};

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [settings, setSettings] = useState(loadSettings);
  const [dirty, setDirty] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setDirty(false);
      toast.success('Settings saved successfully!');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    setDirty(true);
  };

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2><i className="bi bi-gear me-2"></i>Settings</h2>
            <p className="text-muted mb-0">Manage your preferences and application settings</p>
          </div>
          <div className="mt-3 mt-md-0 d-flex gap-2 align-items-center">
            {dirty && <Badge bg="warning" text="dark">Unsaved changes</Badge>}
            <Button variant="primary" onClick={handleSave} disabled={!dirty}>
              <i className="bi bi-check-lg me-1"></i>Save Settings
            </Button>
          </div>
        </div>
      </div>

      <Row>
        {/* Appearance */}
        <Col lg={6} className="mb-4">
          <Card className="content-card settings-card h-100">
            <Card.Header>
              <i className="bi bi-palette me-2"></i><strong>Appearance</strong>
            </Card.Header>
            <Card.Body>
              <div className="settings-item d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                  <h6 className="mb-1">Dark Mode</h6>
                  <small className="text-muted">Switch between light and dark themes</small>
                </div>
                <Form.Check
                  type="switch"
                  id="theme-switch"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  label=""
                  aria-label="Toggle dark mode"
                />
              </div>
              <div className="settings-item d-flex justify-content-between align-items-center py-3">
                <div>
                  <h6 className="mb-1">Compact Tables</h6>
                  <small className="text-muted">Use condensed table rows for denser data display</small>
                </div>
                <Form.Check
                  type="switch"
                  id="compact-tables-switch"
                  checked={settings.compactTables}
                  onChange={() => handleToggle('compactTables')}
                  label=""
                  aria-label="Toggle compact tables"
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      <Row>
        {/* Account */}
        <Col lg={12} className="mb-4">
          <Card className="content-card settings-card h-100">
            <Card.Header>
              <i className="bi bi-person-gear me-2"></i><strong>Account</strong>
            </Card.Header>
            <Card.Body>
              <div className="settings-item d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                  <h6 className="mb-1">Profile</h6>
                  <small className="text-muted">Update your name, email, photo, and other details</small>
                </div>
                <Button variant="outline-primary" size="sm" onClick={() => navigate('/profile')}>
                  <i className="bi bi-pencil me-1"></i>Edit Profile
                </Button>
              </div>
              <div className="settings-item d-flex justify-content-between align-items-center py-3">
                <div>
                  <h6 className="mb-1">Logged in as</h6>
                  <small className="text-muted">{user?.email || 'Unknown'}</small>
                </div>
                <Badge bg="primary">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Reset */}
      <Row className="mb-4">
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-1"></i>Reset to Defaults
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default Settings;
