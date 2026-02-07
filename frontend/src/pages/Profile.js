import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { Container, Row, Col, Card, Button, Form, Image, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useToast from '../hooks/useToast';

const Profile = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
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

  return (
    <div className="d-flex">
      <Sidebar user={user} onLogout={handleLogout} isAdmin={user?.role === 'admin'} />
      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
    <Container className="mt-4 px-4 pb-4 dashboard-main-content">
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2><i className="bi bi-person-circle me-2"></i>My Profile</h2>
            <p className="text-muted mb-0">Manage your personal information</p>
          </div>
          <div className="mt-3 mt-md-0 d-none d-lg-block">
            <Button variant="secondary" className="me-2" onClick={handleBack} aria-label="Back to Dashboard">
              <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
            </Button>
            <Button variant="danger" onClick={handleLogout} aria-label="Logout">
              <i className="bi bi-box-arrow-right me-1"></i>Log Out
            </Button>
          </div>
        </div>
      </div>

      <Row>
        <Col lg={4} className="mb-4">
          <Card className="content-card">
            <Card.Body className="text-center">
              <div className="profile-image-container mx-auto mb-3">
                <Image
                  src={profilePhoto}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {isEditing && (
                <Form.Group className="mb-3">
                  <Form.Label>Change Profile Photo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <Form.Text className="text-muted">
                    Max size: 2MB
                  </Form.Text>
                </Form.Group>
              )}
              <h4 className="mb-2">{profileData.name}</h4>
              <Badge bg={profileData.role === 'admin' ? 'primary' : 'info'} className="mb-2">
                {profileData.role === 'admin' ? 'Administrator' : 'Employee'}
              </Badge>
              <p className="text-muted mb-0">{profileData.department}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} className="mb-4">
          <Card className="content-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Profile Information</strong>
              {!isEditing ? (
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} aria-label="Edit Profile">
                  <i className="bi bi-pencil me-1"></i>Edit Profile
                </Button>
              ) : (
                <div>
                  <Button variant="success" size="sm" className="me-2" onClick={handleSave} disabled={saving} aria-label="Save Changes">
                    {saving ? <><Spinner animation="border" size="sm" className="me-1" />Saving...</> : <><i className="bi bi-check-lg me-1"></i>Save Changes</>}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving} aria-label="Cancel Editing">
                    <i className="bi bi-x-lg me-1"></i>Cancel
                  </Button>
                </div>
              )}
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="bi bi-person me-1"></i>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        aria-label="Full Name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="bi bi-envelope me-1"></i>Email Address <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>Non-editable</Badge></Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profileData.email}
                        readOnly
                        plaintext={!isEditing ? false : undefined}
                        disabled={!isEditing}
                        style={isEditing ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', border: '1px solid #dee2e6' } : {}}
                        aria-label="Email Address"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="bi bi-phone me-1"></i>Mobile Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="mobileNumber"
                        value={profileData.mobileNumber}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Enter mobile number"
                        aria-label="Mobile Number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="bi bi-hash me-1"></i>Employee ID <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>Non-editable</Badge></Form.Label>
                      <Form.Control
                        type="text"
                        name="employeeId"
                        value={profileData.employeeId}
                        readOnly
                        disabled={!isEditing}
                        style={isEditing ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', border: '1px solid #dee2e6' } : {}}
                        aria-label="Employee ID"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="bi bi-building me-1"></i>Department <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>Non-editable</Badge></Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={profileData.department}
                        readOnly
                        disabled={!isEditing}
                        style={isEditing ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', border: '1px solid #dee2e6' } : {}}
                        aria-label="Department"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="bi bi-shield me-1"></i>Role <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>Non-editable</Badge></Form.Label>
                      <Form.Control
                        type="text"
                        value={profileData.role === 'admin' ? 'Administrator' : 'Employee'}
                        readOnly
                        disabled={!isEditing}
                        style={isEditing ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', border: '1px solid #dee2e6' } : {}}
                        aria-label="Role"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
