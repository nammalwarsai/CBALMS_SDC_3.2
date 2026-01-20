import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { Container, Row, Col, Card, Button, Form, Image, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
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
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File size too large. Please select an image under 2MB.");
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
      const updates = {
        name: profileData.name,
        mobileNumber: profileData.mobileNumber,
        profilePhoto: profilePhoto // Send base64 image string
      };

      const { user: updatedUser } = await authService.updateUserProfile(updates);

      // Update local state
      setProfileData({
        ...profileData,
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber
      });
      setProfilePhoto(updatedUser.profilePhotoUrl || 'https://via.placeholder.com/150');

      setIsEditing(false);
      alert('Profile updated successfully!');
      // Reload to ensure all contexts are updated if needed, though state update above handles local view
      window.location.reload();

    } catch (error) {
      console.error("Failed to update profile", error);
      alert('Failed to update profile.');
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
    logout();
    navigate('/login');
  };

  return (
    <Container className="mt-4 px-4">
      {/* Header */}
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2>My Profile</h2>
            <p className="text-muted mb-0">Manage your personal information</p>
          </div>
          <div className="mt-3 mt-md-0">
            <Button variant="secondary" className="me-2" onClick={handleBack}>
              Back to Dashboard
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Log Out
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
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div>
                  <Button variant="success" size="sm" className="me-2" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profileData.email}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="mobileNumber"
                        value={profileData.mobileNumber}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Enter mobile number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Employee ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="employeeId"
                        value={profileData.employeeId}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Department</Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={profileData.department}
                        onChange={handleChange}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileData.role === 'admin' ? 'Administrator' : 'Employee'}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
