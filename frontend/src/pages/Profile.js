import React, { useContext, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useToast from '../hooks/useToast';

const Profile = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    employeeId: user?.employeeId || '',
    department: user?.department || '',
    role: user?.role || ''
  });
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhotoUrl || 'https://via.placeholder.com/150');

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = {
        name: profileData.name,
        mobileNumber: profileData.mobileNumber,
        profilePhoto: profilePhoto
      };

      const { user: updatedUser } = await authService.updateUserProfile(updates);

      // Update local state
      setProfileData({
        ...profileData,
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber
      });
      setProfilePhoto(updatedUser.profilePhotoUrl || 'https://via.placeholder.com/150');

      // Update context without page reload
      updateUser({
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber,
        profilePhotoUrl: updatedUser.profilePhotoUrl
      });

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      mobileNumber: user?.mobileNumber || '',
      employeeId: user?.employeeId || '',
      department: user?.department || '',
      role: user?.role || ''
    });
    setProfilePhoto(user?.profilePhotoUrl || 'https://via.placeholder.com/150');
    setIsEditing(false);
  };

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/employee-dashboard');
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

  const initials = profileData.name
    ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="d-flex">
      <Sidebar user={user} onLogout={handleLogout} isAdmin={user?.role === 'admin'} />
      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
    <Container className="mt-4 px-4 pb-4 dashboard-main-content">

      {/* ─── Hero Banner ─── */}
      <div className="profile-hero-banner">
        <div className="profile-hero-overlay"></div>
        <div className="profile-hero-content">
          <div className="d-flex justify-content-between align-items-start flex-wrap w-100">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              {/* Avatar with animated ring */}
              <div className="profile-avatar-wrapper" onClick={() => isEditing && fileInputRef.current?.click()} style={isEditing ? { cursor: 'pointer' } : {}}>
                <div className="profile-avatar-ring"></div>
                {profilePhoto && profilePhoto !== 'https://via.placeholder.com/150' ? (
                  <img src={profilePhoto} alt="Profile" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-fallback">{initials}</div>
                )}
                {isEditing && (
                  <div className="profile-avatar-edit-overlay">
                    <i className="bi bi-camera-fill"></i>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="profile-hero-info">
                <h2 className="profile-hero-name mb-1">{profileData.name || 'Your Name'}</h2>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <Badge className="profile-role-badge">
                    <i className={`bi ${profileData.role === 'admin' ? 'bi-shield-check' : 'bi-person-badge'} me-1`}></i>
                    {profileData.role === 'admin' ? 'Administrator' : 'Employee'}
                  </Badge>
                  {profileData.department && (
                    <Badge className="profile-dept-badge">
                      <i className="bi bi-building me-1"></i>{profileData.department}
                    </Badge>
                  )}
                </div>
                <p className="profile-hero-email mb-0">
                  <i className="bi bi-envelope me-1"></i>{profileData.email}
                </p>
              </div>
            </div>

            <div className="d-none d-lg-flex gap-2 mt-2 mt-lg-0">
              <Button className="profile-btn-back" onClick={handleBack} aria-label="Back to Dashboard">
                <i className="bi bi-arrow-left me-1"></i>Dashboard
              </Button>
              <Button className="profile-btn-logout" onClick={handleLogout} aria-label="Logout">
                <i className="bi bi-box-arrow-right me-1"></i>Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Stats Row ─── */}
      <Row className="g-3 mb-4" style={{ marginTop: '-2rem', position: 'relative', zIndex: 2 }}>
        <Col xs={6} lg={3}>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
              <i className="bi bi-hash"></i>
            </div>
            <div>
              <div className="profile-stat-label">Employee ID</div>
              <div className="profile-stat-value">{profileData.employeeId || '—'}</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <i className="bi bi-building"></i>
            </div>
            <div>
              <div className="profile-stat-label">Department</div>
              <div className="profile-stat-value">{profileData.department || '—'}</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <i className="bi bi-shield-check"></i>
            </div>
            <div>
              <div className="profile-stat-label">Role</div>
              <div className="profile-stat-value">{profileData.role === 'admin' ? 'Admin' : 'Employee'}</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              <i className="bi bi-calendar-check"></i>
            </div>
            <div>
              <div className="profile-stat-label">Joined</div>
              <div className="profile-stat-value" style={{ fontSize: '0.85rem' }}>{joinDate}</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ─── Profile Details Card ─── */}
      <Card className="profile-details-card">
        <Card.Header className="profile-details-header">
          <div className="d-flex align-items-center gap-2">
            <div className="profile-details-header-icon">
              <i className="bi bi-person-lines-fill"></i>
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem' }}>Personal Information</strong>
              <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
                {isEditing ? 'Edit your personal details below' : 'Your account details and information'}
              </p>
            </div>
          </div>
          <div>
            {!isEditing ? (
              <OverlayTrigger placement="top" overlay={<Tooltip>Edit your profile information</Tooltip>}>
                <Button className="profile-edit-btn" onClick={() => setIsEditing(true)} aria-label="Edit Profile">
                  <i className="bi bi-pencil-square me-1"></i>Edit Profile
                </Button>
              </OverlayTrigger>
            ) : (
              <div className="d-flex gap-2">
                <Button className="profile-save-btn" onClick={handleSave} disabled={saving} aria-label="Save Changes">
                  {saving ? <><Spinner animation="border" size="sm" className="me-1" />Saving...</> : <><i className="bi bi-check-circle me-1"></i>Save</>}
                </Button>
                <Button className="profile-cancel-btn" onClick={handleCancel} disabled={saving} aria-label="Cancel Editing">
                  <i className="bi bi-x-circle me-1"></i>Cancel
                </Button>
              </div>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          <Form>
            {/* Editable Fields Section */}
            <div className="profile-section-title">
              <i className="bi bi-pencil me-2"></i>Editable Information
            </div>
            <Row className="g-4 mb-4">
              <Col md={6}>
                <div className={`profile-field-card ${isEditing ? 'editing' : ''}`}>
                  <Form.Label className="profile-field-label">
                    <i className="bi bi-person-fill me-2"></i>Full Name
                  </Form.Label>
                  <Form.Control
                    className="profile-field-input"
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    aria-label="Full Name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={`profile-field-card ${isEditing ? 'editing' : ''}`}>
                  <Form.Label className="profile-field-label">
                    <i className="bi bi-phone-fill me-2"></i>Mobile Number
                  </Form.Label>
                  <Form.Control
                    className="profile-field-input"
                    type="tel"
                    name="mobileNumber"
                    value={profileData.mobileNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter mobile number"
                    aria-label="Mobile Number"
                  />
                </div>
              </Col>
            </Row>

            {/* Read-Only Fields Section */}
            <div className="profile-section-title">
              <i className="bi bi-lock me-2"></i>Account Information
              <span className="profile-section-subtitle">These fields cannot be changed</span>
            </div>
            <Row className="g-4">
              <Col md={6}>
                <div className="profile-field-card readonly">
                  <Form.Label className="profile-field-label">
                    <i className="bi bi-envelope-fill me-2"></i>Email Address
                    <Badge className="profile-locked-badge ms-2"><i className="bi bi-lock-fill me-1"></i>Locked</Badge>
                  </Form.Label>
                  <Form.Control
                    className="profile-field-input"
                    type="email"
                    name="email"
                    value={profileData.email}
                    readOnly
                    disabled
                    aria-label="Email Address"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="profile-field-card readonly">
                  <Form.Label className="profile-field-label">
                    <i className="bi bi-hash me-2"></i>Employee ID
                    <Badge className="profile-locked-badge ms-2"><i className="bi bi-lock-fill me-1"></i>Locked</Badge>
                  </Form.Label>
                  <Form.Control
                    className="profile-field-input"
                    type="text"
                    name="employeeId"
                    value={profileData.employeeId}
                    readOnly
                    disabled
                    aria-label="Employee ID"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="profile-field-card readonly">
                  <Form.Label className="profile-field-label">
                    <i className="bi bi-building me-2"></i>Department
                    <Badge className="profile-locked-badge ms-2"><i className="bi bi-lock-fill me-1"></i>Locked</Badge>
                  </Form.Label>
                  <Form.Control
                    className="profile-field-input"
                    type="text"
                    name="department"
                    value={profileData.department}
                    readOnly
                    disabled
                    aria-label="Department"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="profile-field-card readonly">
                  <Form.Label className="profile-field-label">
                    <i className="bi bi-shield-fill me-2"></i>Role
                    <Badge className="profile-locked-badge ms-2"><i className="bi bi-lock-fill me-1"></i>Locked</Badge>
                  </Form.Label>
                  <Form.Control
                    className="profile-field-input"
                    type="text"
                    value={profileData.role === 'admin' ? 'Administrator' : 'Employee'}
                    readOnly
                    disabled
                    aria-label="Role"
                  />
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        show={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        onConfirm={confirmAction || (() => {})}
        {...confirmConfig}
      />
    </Container>
      </div>
    </div>
  );
};

export default Profile;
