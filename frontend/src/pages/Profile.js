import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { Container, Row, Col, Card, Button, Form, Image } from 'react-bootstrap';
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
        mobileNumber: profileData.mobileNumber
      };

      const { user: updatedUser } = await authService.updateUserProfile(updates);

      // Update local state and context if needed (though context usually pulls from local storage or api)
      // Since authService updates localStorage, we might need to trigger a context refresh or just simple state update
      // Taking a shortcut: manually updating context user state if exposed, but context relies on checking local storage or state
      // We can force a reload or if setUser is available from context...
      // In this file, we only destructured { user, logout }. Let's assume we can also get setUser if we change context, 
      // but for now let's just alert and re-render.

      setIsEditing(false);
      alert('Profile updated successfully!');
      // Ideally we should update the context's user object to reflect changes immediately without reload
      // But looking at AuthContext, it doesn't expose setUser directly in the return value?
      // Let's check AuthContext: value={{ user, login, loginAsAdmin, logout, register, loading }}
      // It doesn't expose setUser.
      // However, we can reload the page to fetch fresh data or simpler: navigation.
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
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>My Profile</h2>
            <div>
              <Button variant="secondary" className="me-2" onClick={handleBack}>
                Back to Dashboard
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Body className="text-center">
              <Image
                src={profilePhoto}
                roundedCircle
                width={150}
                height={150}
                className="mb-3"
                style={{ objectFit: 'cover' }}
              />
              {isEditing && (
                <Form.Group className="mb-3">
                  <Form.Label>Change Profile Photo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <Form.Text className="text-muted">
                    Select a new profile photo
                  </Form.Text>
                </Form.Group>
              )}
              <h4>{profileData.name}</h4>
              <p className="text-muted">{profileData.role === 'admin' ? 'Administrator' : 'Employee'}</p>
              <p className="text-muted">{profileData.department}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} className="mb-4">
          <Card>
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
                      <Form.Label>Email</Form.Label>
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
